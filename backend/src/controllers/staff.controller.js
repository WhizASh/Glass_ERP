const { createHash } = require('node:crypto');
const prisma = require('../lib/prisma');
const { StaffError, parseDate, payrollPeriod, moneyInCents, calculateEntry } = require('../services/payroll.service');

const salaryHistory = { salaries: { orderBy: { effectiveOn: 'asc' } } };
const employeeOrder = [{ name: 'asc' }, { employeeCode: 'asc' }];

function field(body, key, label, max, optional = false) {
  const value = body[key];
  if (optional && (value === undefined || value === null || value === '')) return null;
  if (typeof value !== 'string' || value.trim().length > max || (!optional && !value.trim())) {
    throw new StaffError(`${label} must be ${optional ? 'at most' : 'between 1 and'} ${max} characters.`);
  }
  return value.trim() || null;
}

function employeeData(body) {
  const joinedOn = parseDate(body.joinedOn, 'Joining date');
  const leftOn = body.leftOn ? parseDate(body.leftOn, 'Last working day') : null;
  if (leftOn && leftOn < joinedOn) throw new StaffError('Last working day cannot be before joining.');
  return {
    employeeCode: field(body, 'employeeCode', 'Employee ID', 40),
    name: field(body, 'name', 'Name', 120),
    role: field(body, 'role', 'Role', 120),
    phone: field(body, 'phone', 'Phone', 40, true),
    address: field(body, 'address', 'Address', 500, true),
    joinedOn,
    leftOn
  };
}

const serializable = (work) => prisma.$transaction(work, { isolationLevel: 'Serializable' });

async function listEmployees(req, res) {
  res.json(await prisma.employee.findMany({ include: salaryHistory, orderBy: employeeOrder }));
}

async function createEmployee(req, res) {
  const data = employeeData(req.body);
  moneyInCents(req.body.salary, 'Monthly salary');
  const employee = await prisma.employee.create({
    data: { ...data, salaries: { create: { effectiveOn: data.joinedOn, amount: req.body.salary } } },
    include: salaryHistory
  });
  res.status(201).json(employee);
}

async function updateEmployee(req, res) {
  const data = employeeData(req.body);
  const salaryChange = req.body.salaryChange;
  const employeeId = req.params.id;
  const employee = await serializable(async (tx) => {
    const existing = await tx.employee.findUnique({ where: { id: employeeId }, include: salaryHistory });
    if (!existing) throw new StaffError('Employee not found.', 404);

    const [initial, next] = existing.salaries;
    if (+data.joinedOn !== +existing.joinedOn) {
      if (next && data.joinedOn >= next.effectiveOn) {
        throw new StaffError('Joining date must be before the first salary change.');
      }
      await tx.employeeSalary.update({
        where: { employeeId_effectiveOn: { employeeId, effectiveOn: initial.effectiveOn } },
        data: { effectiveOn: data.joinedOn }
      });
    }

    if (salaryChange != null) {
      const effectiveOn = parseDate(salaryChange.effectiveOn, 'Salary effective date');
      const amount = salaryChange.amount;
      moneyInCents(amount, 'Monthly salary');
      if (effectiveOn < data.joinedOn || (data.leftOn && effectiveOn > data.leftOn)) {
        throw new StaffError('Salary effective date must fall within employment dates.');
      }
      await tx.employeeSalary.upsert({
        where: { employeeId_effectiveOn: { employeeId, effectiveOn } },
        create: { employeeId, effectiveOn, amount },
        update: { amount }
      });
    }
    return tx.employee.update({ where: { id: employeeId }, data, include: salaryHistory });
  });
  res.json(employee);
}

function adjustmentMap(values = []) {
  if (!Array.isArray(values)) throw new StaffError('Payroll adjustments must be a list.');
  const adjustments = new Map();
  for (const value of values) {
    if (typeof value?.employeeId !== 'string' || adjustments.has(value.employeeId)) {
      throw new StaffError('Each adjustment must identify a different employee.');
    }
    adjustments.set(value.employeeId, value);
  }
  return adjustments;
}

async function draftPayroll(db, month, period, values) {
  const adjustments = adjustmentMap(values);
  const employees = await db.employee.findMany({
    where: {
      joinedOn: { lte: period.end },
      OR: [{ leftOn: null }, { leftOn: { gte: period.start } }]
    },
    include: salaryHistory,
    orderBy: employeeOrder
  });
  const entries = employees.map((employee) => {
    const adjustment = adjustments.get(employee.id);
    adjustments.delete(employee.id);
    return calculateEntry(employee, period, adjustment);
  });
  if (adjustments.size) throw new StaffError('An adjusted employee is no longer eligible for this month.', 409);
  const revision = createHash('sha256').update(JSON.stringify(entries)).digest('hex');
  return { month, days: period.days, entries, revision };
}

async function getPayroll(req, res) {
  const month = req.params.month;
  const period = payrollPeriod(month);
  const run = await prisma.payrollRun.findUnique({
    where: { month },
    include: { entries: { orderBy: employeeOrder } }
  });
  res.json(run ? { ...run, days: period.days } : await draftPayroll(prisma, month, period));
}

async function previewPayroll(req, res) {
  const month = req.params.month;
  res.json(await draftPayroll(prisma, month, payrollPeriod(month), req.body.adjustments));
}

async function savePayroll(req, res) {
  const month = req.params.month;
  const period = payrollPeriod(month);
  const run = await serializable(async (tx) => {
    const draft = await draftPayroll(tx, month, period, req.body.adjustments);
    if (!draft.entries.length) throw new StaffError('There are no eligible employees this month.');
    if (draft.revision !== req.body.revision) {
      throw new StaffError('Payroll changed since the preview. Recalculate and review the totals before saving.', 409);
    }
    return tx.payrollRun.create({
      data: { month, entries: { createMany: { data: draft.entries } } },
      include: { entries: { orderBy: employeeOrder } }
    });
  });
  res.status(201).json({ ...run, days: period.days });
}

module.exports = { listEmployees, createEmployee, updateEmployee, getPayroll, previewPayroll, savePayroll };
