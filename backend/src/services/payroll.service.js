const DAY_MS = 86_400_000;
const MAX_MONEY = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;

class StaffError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function parseDate(value, label) {
  if (typeof value !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) {
    throw new StaffError(`${label} must be a valid date.`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(+date) || date.toISOString().slice(0, 10) !== value) {
    throw new StaffError(`${label} must be a valid date.`);
  }
  return date;
}

function payrollPeriod(month) {
  if (typeof month !== 'string' || !/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new StaffError('Select a valid payroll month.');
  }
  const start = parseDate(`${month}-01`, 'Payroll month');
  const next = Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1);
  return { start, end: new Date(next - DAY_MS), days: (next - start) / DAY_MS };
}

function moneyInCents(value, label) {
  if (typeof value !== 'string' || !MAX_MONEY.test(value)) {
    throw new StaffError(`${label} must be a nonnegative amount with up to two decimal places.`);
  }
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}

function decimalAmount(cents) {
  return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
}

function calculateEntry(employee, period, adjustment = {}) {
  const first = Math.max(+period.start, +employee.joinedOn);
  const last = Math.min(+period.end, employee.leftOn ? +employee.leftOn : Infinity);
  const eligibleDays = (last - first) / DAY_MS + 1;
  const unpaidDays = adjustment.unpaidDays ?? 0;
  if (!Number.isInteger(unpaidDays) || unpaidDays < 0 || unpaidDays > eligibleDays) {
    throw new StaffError(`Unpaid days for ${employee.name} must be between 0 and ${eligibleDays}.`);
  }

  let salaryIndex = -1;
  let weightedCents = 0n;
  for (let day = first; day <= last; day += DAY_MS) {
    while (employee.salaries[salaryIndex + 1]?.effectiveOn <= day) salaryIndex++;
    const salary = employee.salaries[salaryIndex];
    if (!salary) throw new StaffError(`No salary covers the payroll period for ${employee.name}.`, 409);
    weightedCents += moneyInCents(salary.amount.toString(), 'Monthly salary');
  }

  const paidDays = eligibleDays - unpaidDays;
  // A count of unpaid days has no dates. Value those days at the average eligible daily rate.
  const divisor = BigInt(period.days * eligibleDays);
  const basePay = (weightedCents * BigInt(paidDays) + divisor / 2n) / divisor;
  const additions = moneyInCents(adjustment.additions ?? '0', 'Additions');
  const deductions = moneyInCents(adjustment.deductions ?? '0', 'Deductions');
  const grossPay = basePay + additions;
  if (deductions > grossPay) throw new StaffError(`Deductions cannot exceed gross pay for ${employee.name}.`);

  return {
    employeeId: employee.id,
    employeeCode: employee.employeeCode,
    name: employee.name,
    eligibleDays,
    unpaidDays,
    paidDays,
    basePay: decimalAmount(basePay),
    additions: decimalAmount(additions),
    deductions: decimalAmount(deductions),
    grossPay: decimalAmount(grossPay),
    netPay: decimalAmount(grossPay - deductions)
  };
}

module.exports = { StaffError, parseDate, payrollPeriod, moneyInCents, calculateEntry };
