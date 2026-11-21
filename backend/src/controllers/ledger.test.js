const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { Prisma } = require('@prisma/client');
const receipts = [];
let failDatabase = false;
const orders = [
  { id: 'sale-a', customerId: 'a', orderNumber: 'SO-1', totalAmount: '100.10', status: 'PENDING', paymentStatus: 'PARTIAL' },
  { id: 'sale-b', customerId: 'b', totalAmount: '999.00', status: 'PENDING' },
  { id: 'cancelled', customerId: 'a', totalAmount: '500.00', status: 'CANCELLED' }
];
const fake = {
  customer: { findMany: async () => [{ id: 'a', name: 'Party a' }], findUnique: async ({ where }) => {
    if (failDatabase) throw new Error('Database unavailable');
    return ['a', 'b'].includes(where.id) ? { id: where.id, name: `Party ${where.id}` } : null;
  } },
  saleOrder: {
    findUnique: async ({ where }) => orders.find(row => row.id === where.id) || null,
    update: async ({ where, data }) => { const row = orders.find(row => row.id === where.id); Object.assign(row, data); return row; },
    findMany: async ({ where, orderBy }) => {
    assert.equal(where.status.not, 'CANCELLED');
    assert.deepEqual(orderBy, [{ orderDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }]);
    return orders.filter(row => (!where.customerId || row.customerId === where.customerId) && row.status !== where.status.not);
  } },
  purchase: { findMany: async () => [{ id: 'purchase-1', supplier: 'Glass supplier', totalCost: '75.10', amountPaid: '25.05', paymentStatus: 'PARTIAL', purchaseDate: '2026-11-20' }] },
  employee: { findMany: async () => [{ id: 'e1', name: 'Employee One', employeeCode: 'E1' }], findUnique: async ({ where }) => where.id === 'e1' ? { name: 'Employee One', employeeCode: 'E1' } : null },
  payrollEntry: { findMany: async ({ where }) => [{ month: '2026-11', employeeId: 'e1', name: 'Employee One', employeeCode: 'E1', netPay: '125.25', run: { createdAt: '2026-11-21T00:00:00.000Z' } }].filter(row => !where.employeeId || row.employeeId === where.employeeId) },
  customerReceipt: {
    findMany: async ({ where, orderBy }) => {
      assert.deepEqual(orderBy, [{ paymentDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }]);
      return receipts.filter(row => !where.customerId || row.customerId === where.customerId);
    },
    create: async ({ data }) => { const row = { ...data, id: String(receipts.length), createdAt: new Date(), amount: new Prisma.Decimal(data.amount) }; receipts.push(row); return row; }
  },
  $transaction: async (callback, options) => { assert.ok(['RepeatableRead', 'Serializable'].includes(options.isolationLevel)); return callback(fake); }
};
require.cache[require.resolve('../lib/prisma')] = { exports: fake };
const app = require('express')();
app.use(require('express').json());
app.use('/api/ledger', require('../routes/ledger.routes'));
let server;
let base;
before(async () => {
  server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  base = `http://127.0.0.1:${server.address().port}/api/ledger`;
});
after(() => new Promise(resolve => server.close(resolve)));
const post = (id, body) => fetch(`${base}/${id}/receipts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const valid = { paymentDate: '2026-11-20', amount: '20.05', paymentType: 'CASH' };

test('HTTP ledger isolates customers, persists receipts, rejects invalid input and handles errors', async () => {
  let ledger = await (await fetch(`${base}/a`)).json();
  assert.equal(ledger.totals.balanceReceivable, '100.10');
  assert.equal(ledger.sales.length, 1);
  assert.equal(ledger.hasUnknownPartialPayments, true);
  const saved = await post('a', { ...valid, customerId: 'b', saleOrderId: 'sale-a' });
  assert.equal(saved.status, 201);
  assert.equal((await saved.json()).customerId, 'a');
  ledger = await (await fetch(`${base}/a`)).json();
  assert.equal(ledger.totals.balanceReceivable, '80.05');
  assert.equal(ledger.inflow[0].kind, 'Customer payment');
  assert.equal((await post('a', { ...valid, amount: -1, saleOrderId: 'sale-a' })).status, 400);
  assert.equal(receipts.length, 0);
  assert.equal((await fetch(`${base}/missing`)).status, 404);
  assert.equal((await post('missing', valid)).status, 404);
  failDatabase = true;
  try {
    assert.equal((await fetch(`${base}/a`)).status, 500);
    const failure = await post('a', { ...valid, saleOrderId: 'sale-a' });
    assert.equal(failure.status, 500);
    assert.match((await failure.json()).error, /Unable to record/);
    assert.equal(receipts.length, 0);
  } finally { failDatabase = false; }
});


test('all parties includes both registers and supplier view isolates purchases', async () => {
  const combined = await (await fetch(`${base}/all`)).json();
  assert.equal(combined.customer.name, 'All parties');
  assert.equal(combined.totals.saleAmount, '1099.10');
  assert.equal(combined.totals.purchaseAmount, '75.10');
  assert.equal(combined.totals.amountPaid, '25.05');
  assert.equal(combined.totals.balancePayable, '50.05');
  assert.equal(combined.totals.payrollAccrued, '125.25');
  assert.equal(combined.inflow.find(row => row.kind === 'Payroll accrued').amount, '125.25');
  const supplier = await (await fetch(`${base}/${encodeURIComponent('supplier:glass supplier')}`)).json();
  assert.equal(supplier.sales.length, 0);
  assert.equal(supplier.purchases.length, 1);
  assert.equal(supplier.totals.outflow, '25.05');
  assert.equal(supplier.totals.inflow, '75.10');
});

test('employee ledger isolates saved payroll and lists employees as parties', async () => {
  const parties = await (await fetch(`${base}/parties`)).json();
  assert.ok(parties.some(row => row.id === 'employee:e1' && row.type === 'Employee'));
  const ledger = await (await fetch(`${base}/employee:e1`)).json();
  assert.equal(ledger.totals.payrollAccrued, '125.25');
  assert.equal(ledger.inflow[0].reference, '2026-11 · E1');
  assert.equal(ledger.outflow.length, 0);
  assert.equal((await fetch(`${base}/employee:missing`)).status, 404);
});


test('allocated receipts update the sale once, reject overpayments and isolate customers', async () => {
  const payment = { ...valid, saleOrderId: 'sale-a' };
  const response = await post('a', payment);
  assert.equal(response.status, 201);
  assert.equal(orders[0].paymentStatus, 'PARTIAL');
  assert.equal(orders[0].amountReceived.toFixed(2), '20.05');
  assert.equal(receipts.length, 0);
  let ledger = await (await fetch(`${base}/a`)).json();
  assert.equal(ledger.totals.amountReceived, '40.10');
  assert.equal((await post('b', payment)).status, 400);
  assert.equal((await post('a', { ...payment, amount: 1000 })).status, 400);
  assert.equal((await post('a', { ...payment, amount: '80.05' })).status, 201);
  assert.equal(orders[0].paymentStatus, 'PAID');
  ledger = await (await fetch(`${base}/a`)).json();
  assert.equal(ledger.totals.amountReceived, '120.15');
  assert.equal(ledger.inflow.filter(row => row.kind === 'Customer payment').length, 1);
});
