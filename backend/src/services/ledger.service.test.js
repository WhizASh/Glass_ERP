const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildLedger, parseReceipt } = require('./ledger.service');
const customer = { id: 'customer-a' };
const valid = { paymentDate: '2026-11-20', paymentType: 'UPI', amount: '50000.00', reference: '  UPI-123  ' };

test('matches the spreadsheet and subtracts only actual receipts', () => {
  const orders = [71641, 83352, 72877, 35518].map((totalAmount, i) => ({ id: String(i), totalAmount, paymentStatus: i ? 'UNPAID' : 'PAID' }));
  orders.push({ totalAmount: 99999, status: 'CANCELLED' });
  let ledger = buildLedger(customer, orders, []);
  assert.deepEqual(ledger.totals, { saleAmount: '263388.00', amountReceived: '0.00', balanceReceivable: '263388.00' });
  assert.equal(ledger.counts.sales, 4);
  assert.equal(ledger.hasHistoricalPaymentStatuses, true);
  ledger = buildLedger(customer, orders, []);
  assert.equal(ledger.totals.balanceReceivable, '263388.00');
});

test('preserves decimal precision and existing final totals for empty ledgers', () => {
  assert.equal(buildLedger(customer, [{ totalAmount: '0.10' }, { totalAmount: '0.20' }], []).totals.saleAmount, '0.30');
  const ledger = buildLedger(customer, [{ totalAmount: '110.25', subtotal: 100, taxAmount: 20, discountAmount: 9.75, paymentStatus: 'PAID' }], []);
  assert.equal(ledger.totals.balanceReceivable, '0.00');
  assert.equal(ledger.totals.saleAmount, '110.25');
  assert.equal(buildLedger(customer, [], []).hasHistoricalPaymentStatuses, false);
  assert.equal(buildLedger(customer, [], []).totals.balanceReceivable, '0.00');
  assert.equal(buildLedger(customer, [{ totalAmount: 1, paymentStatus: 'PARTIAL' }], []).hasHistoricalPaymentStatuses, true);
});

test('validates and normalizes receipt input without trusting customer or totals in the body', () => {
  const receipt = parseReceipt({ ...valid, customerId: 'other', totalAmount: 0 });
  assert.equal(receipt.amount.toFixed(2), '50000.00');
  assert.equal(receipt.reference, 'UPI-123');
  assert.equal(receipt.customerId, undefined);
  assert.equal(receipt.paymentDate.toISOString(), '2026-11-20T00:00:00.000Z');
  assert.equal(parseReceipt({ ...valid, paymentDate: '2024-02-29', amount: 0.01 }).amount.toFixed(2), '0.01');
  for (const override of [
    { amount: 0 }, { amount: -1 }, { amount: '' }, { amount: null }, { amount: true },
    { amount: '1e3' }, { amount: '0.001' }, { amount: '1abc' }, { amount: Infinity },
    { amount: '1000000000000' }, { paymentType: 'INVALID' }, { paymentType: {} },
    { paymentDate: '2026-02-29' }, { paymentDate: '2026-02-30' }, { paymentDate: '0000-01-01' },
    { paymentDate: '2026-13-01' }, { paymentDate: '2026-11-20T00:00:00Z' },
    { reference: {} }, { reference: 'x'.repeat(201) }, { notes: 'x'.repeat(2001) }
  ]) assert.throws(() => parseReceipt({ ...valid, ...override }), undefined, JSON.stringify(override));
  for (const body of [null, [], 'invalid']) assert.throws(() => parseReceipt(body));
});


const { transactionLedger, supplierKey } = require('./ledger.service');
const { settlement } = require('./settlement.service');

test('transaction edits replace ledger amounts and cancellation removes charges and settlement', () => {
  const sale = { id: 'sale', totalAmount: '100.10', paymentStatus: 'PAID', customer: { name: 'Customer' } };
  const purchase = { id: 'buy', totalCost: '80.10', amountPaid: '20.05', paymentStatus: 'PARTIAL', supplier: 'Supplier' };
  let ledger = transactionLedger(customer, [sale], [purchase], []);
  assert.equal(ledger.totals.amountReceived, '100.10');
  assert.equal(ledger.totals.balanceReceivable, '0.00');
  assert.equal(ledger.totals.balancePayable, '60.05');
  sale.totalAmount = '150.25';
  purchase.totalCost = '90.10';
  purchase.amountPaid = '30.10';
  ledger = transactionLedger(customer, [sale], [purchase], []);
  assert.equal(ledger.totals.amountReceived, '150.25');
  assert.equal(ledger.totals.purchaseAmount, '90.10');
  assert.equal(ledger.outflow.length, 2);
  assert.equal(ledger.inflow.length, 2);
  sale.status = 'CANCELLED';
  ledger = transactionLedger(customer, [sale], [purchase], []);
  assert.equal(ledger.totals.saleAmount, '0.00');
  assert.equal(ledger.totals.amountReceived, '0.00');
  assert.equal(supplierKey('  GLASS Supplier  '), supplierKey('glass supplier'));
});


test('settlements validate partial amounts and dates and synchronize status amounts', () => {
  assert.equal(settlement({ paymentStatus: 'PAID' }, '123.45', 'amountReceived').amountReceived.toFixed(2), '123.45');
  assert.equal(settlement({ paymentStatus: 'UNPAID', amountPaid: 80 }, 100, 'amountPaid').amountPaid.toFixed(2), '0.00');
  assert.equal(settlement({ paymentStatus: 'PARTIAL', amountPaid: '20.05' }, 100, 'amountPaid').amountPaid.toFixed(2), '20.05');
  for (const body of [{paymentStatus:'INVALID'}, {paymentStatus:'PARTIAL',amountPaid:0}, {paymentStatus:'PARTIAL',amountPaid:100}, {paymentStatus:'PARTIAL',amountPaid:'1.001'}, {paymentDate:'2026-02-30'}, {paymentReference:{}}]) assert.throws(() => settlement(body, 100, 'amountPaid'));
});
