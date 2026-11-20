const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDemoData, seedDemo } = require('./seed-demo');
const { calculateItemSqft, calculateQuotationTotals } = require('../src/services/glassCalculations.service');

const fixtures = () => buildDemoData(new Date('2026-11-20T12:00:00Z'));

test('demo commercial totals, relationships and settlements agree', () => {
  const data = fixtures();
  const customers = new Set(data.customer.map(row => row.id));
  const products = new Set(data.productSku.map(row => row.id));
  for (const quote of data.quotation) {
    assert.ok(customers.has(quote.customerId));
    const items = quote.sections.create.flatMap(section => section.items.create);
    for (const item of items) {
      assert.ok(products.has(item.productSkuId));
      assert.equal(item.areaSqFt, calculateItemSqft(item.widthInches, item.heightInches));
      assert.equal(item.totalPrice, Number((item.areaSqFt * item.quantity * item.unitPrice).toFixed(2)));
    }
    const pricing = calculateQuotationTotals({ ...quote, subtotal: items.reduce((sum, row) => sum + row.totalPrice, 0) });
    for (const field of ['subtotal', 'discountAmount', 'taxAmount', 'totalAmount']) assert.equal(quote[field], pricing[field]);
  }
  for (const sale of data.saleOrder) {
    const quote = data.quotation.find(row => row.id === sale.quotationId);
    assert.equal(sale.customerId, quote.customerId);
    assert.equal(sale.totalAmount, quote.totalAmount);
    const received = Number(sale.amountReceived);
    if (sale.paymentStatus === 'PAID') assert.equal(received, sale.totalAmount);
    if (sale.paymentStatus === 'PARTIAL') assert.ok(received > 0 && received < sale.totalAmount);
    if (sale.paymentStatus === 'UNPAID') assert.equal(received, 0);
  }
  for (const purchase of data.purchase) {
    assert.equal(purchase.totalCost, purchase.quantity * purchase.unitPrice + purchase.additionalCost);
    const paid = Number(purchase.amountPaid);
    if (purchase.paymentStatus === 'PAID') assert.equal(paid, purchase.totalCost);
    if (purchase.paymentStatus === 'PARTIAL') assert.ok(paid > 0 && paid < purchase.totalCost);
    if (purchase.paymentStatus === 'UNPAID') assert.equal(paid, 0);
  }
});

test('repeat seeds skip existing demo data and preserve edits and unrelated records', async () => {
  const data = fixtures();
  const stores = Object.fromEntries(Object.keys(data).map(model => [model, new Map()]));
  stores.customer.set('real-customer', { id: 'real-customer', name: 'Existing customer' });
  let transactions = 0;
  const tx = Object.fromEntries(Object.entries(stores).map(([model, store]) => [model, {
    findUnique: async ({ where }) => store.get(where.id) || null,
    create: async ({ data: record }) => {
      assert.equal(store.has(record.id), false);
      store.set(record.id, { ...record });
      return record;
    }
  }]));
  const prisma = { $transaction: async (callback, options) => {
    transactions++;
    assert.equal(options.isolationLevel, 'Serializable');
    return callback(tx);
  } };
  const first = await seedDemo(prisma, data);
  stores.saleOrder.get('demo-sale-2').deliveryAddress = 'User edited address';
  const second = await seedDemo(prisma, data);
  for (const [model, rows] of Object.entries(data)) {
    assert.equal(first[model].created, rows.length);
    assert.equal(second[model].created, 0);
    assert.equal(second[model].skipped, rows.length);
  }
  assert.equal(stores.customer.get('real-customer').name, 'Existing customer');
  assert.equal(stores.saleOrder.get('demo-sale-2').deliveryAddress, 'User edited address');
  assert.equal(transactions, 2);
});
