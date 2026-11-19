const assert = require('node:assert/strict');
const test = require('node:test');
const { calculateEntry, parseDate, payrollPeriod } = require('./payroll.service');

const date = (value) => parseDate(value, 'Date');

test('prorates joining and departure inclusively and applies a raise on its effective date', () => {
  const employee = {
    id: 'employee-1',
    employeeCode: 'GL-110',
    name: 'Meera Rao',
    joinedOn: date('2026-06-11'),
    leftOn: date('2026-06-25'),
    salaries: [
      { effectiveOn: date('2026-06-11'), amount: '30000' },
      { effectiveOn: date('2026-06-21'), amount: '60000' }
    ]
  };
  const june = payrollPeriod('2026-06');
  const result = calculateEntry(employee, june, { unpaidDays: 1, additions: '500', deductions: '100' });

  assert.equal(result.eligibleDays, 15);
  assert.equal(result.paidDays, 14);
  assert.equal(result.basePay, '18666.67');
  assert.equal(result.grossPay, '19166.67');
  assert.equal(result.netPay, '19066.67');
  assert.throws(() => calculateEntry(employee, june, { unpaidDays: 16 }), /between 0 and 15/);
  assert.throws(() => calculateEntry(employee, june, { unpaidDays: 15, deductions: '0.01' }), /exceed gross pay/);
});

test('uses actual leap-month days and rounds fractional cents once', () => {
  const february = payrollPeriod('2028-02');
  const employee = {
    joinedOn: date('2027-11-01'),
    leftOn: date('2028-02-01'),
    salaries: [{ effectiveOn: date('2027-11-01'), amount: '1000' }]
  };
  assert.equal(february.days, 29);
  assert.equal(calculateEntry(employee, february).basePay, '34.48');
  assert.throws(() => parseDate('2026-02-29', 'Joining date'), /valid date/);
});
