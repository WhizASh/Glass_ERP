const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { parsePurchase } = require('../services/purchases.service');

const valid = {
  materialName: '  Clear glass  ', supplier: 'Glass supplier', purchaseDate: '2026-11-17',
  unitOfMeasure: 'PCS', quantity: '2.5', unitPrice: '10.25', additionalCost: '1.50'
};

test('calculates and rounds cost using decimals, ignoring client-provided total and product fields', () => {
  const result = parsePurchase({ ...valid, totalCost: 1, productSkuId: 'unrelated', stock: 100 });
  assert.equal(result.materialName, 'Clear glass');
  assert.equal(result.totalCost.toFixed(2), '27.13');
  assert.equal(result.purchaseDate.toISOString(), '2026-11-17T00:00:00.000Z');
  assert.equal(result.productSkuId, undefined);
  assert.equal(result.stock, undefined);
  assert.equal(parsePurchase({ ...valid, quantity: '3', unitPrice: '0.10', additionalCost: 0 }).totalCost.toString(), '0.3');
  assert.equal(parsePurchase({ ...valid, unitPrice: 0, additionalCost: undefined }).totalCost.toString(), '0');
});

test('rejects invalid dates, missing fields, negative, malformed, oversized and imprecise numbers', () => {
  for (const override of [
    { materialName: '' }, { materialName: '   ' }, { materialName: 5 }, { materialName: 'x'.repeat(201) },
    { supplier: {} }, { notes: 'x'.repeat(2001) }, { unitOfMeasure: 'INVALID' },
    { quantity: 0 }, { quantity: -1 }, { quantity: true }, { quantity: null },
    { quantity: '' }, { quantity: '1abc' }, { quantity: '1e9' }, { quantity: '0.0001' },
    { quantity: '1000000000' }, { unitPrice: '-1' }, { unitPrice: '0.001' },
    { unitPrice: Infinity }, { additionalCost: -2 }, { additionalCost: null },
    { purchaseDate: '2026-02-30' }, { purchaseDate: '2026-13-01' }, { purchaseDate: '0000-01-01' }, { purchaseDate: '' },
    { purchaseDate: '2026-11-17T00:00:00Z' }
  ]) assert.throws(() => parsePurchase({ ...valid, ...override }), undefined, JSON.stringify(override));
  assert.throws(() => parsePurchase(null));
  assert.throws(() => parsePurchase([]));
});

// Raw material inventory is separate from Product SKUs.
const records = [];
let failDatabase = false;
const fakePrisma = {
  purchase: {
    findUnique: async ({ where }) => records.find(record => record.id === where.id) || null,
    update: async ({ where, data }) => {
      const row = records.find(record => record.id === where.id);
      if (!row) throw Object.assign(new Error('Missing purchase'), { code: 'P2025' });
      Object.assign(row, data);
      return row;
    },
    create: async ({ data }) => {
      if (failDatabase) throw new Error('Test database unavailable');
      const record = { ...data, id: String(records.length + 1), createdAt: new Date() };
      records.push(record);
      return record;
    },
    findMany: async ({ where, take, skip, orderBy }) => {
      if (failDatabase) throw new Error('Test database unavailable');
      assert.deepEqual(orderBy, [{ purchaseDate: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }]);
      return matching(where).slice().reverse().slice(skip, skip + take);
    },
    count: async ({ where }) => matching(where).length
  },
  inventoryItem: require('../test-support/inventory-db').inventoryDatabase().inventoryItem,
  $transaction: operations => Array.isArray(operations) ? Promise.all(operations) : operations(fakePrisma)
};
const matching = where => records.filter(record => !where.OR || where.OR.some(condition => {
  const [field, filter] = Object.entries(condition)[0];
  assert.equal(filter.mode, 'insensitive');
  return (record[field] || '').toLowerCase().includes(filter.contains.toLowerCase());
}));
require.cache[require.resolve('../lib/prisma')] = { exports: fakePrisma };
const express = require('express');
const app = express();
app.use(express.json());
app.use('/api/purchases', require('../routes/purchases.routes'));
let server;
let base;
before(async () => {
  server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  base = `http://127.0.0.1:${server.address().port}/api/purchases`;
});
after(() => new Promise(resolve => server.close(resolve)));

test('purchase HTTP endpoints create records, search and paginate without touching products', async () => {
  let response = await fetch(base);
  assert.deepEqual(await response.json(), { records: [], total: 0, page: 1, pageSize: 25 });
  for (let index = 0; index < 26; index++) {
    response = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...valid, materialName: index === 0 ? 'Tinted glass' : 'Clear glass' }) });
    assert.equal(response.status, 201);
    const saved = await response.json();
    assert.equal(saved.totalCost, '27.13');
    assert.equal(saved.quantity, '2.5');
  }
  let result = await (await fetch(base)).json();
  assert.equal(result.records.length, 25);
  assert.equal(result.total, 26);
  result = await (await fetch(`${base}?page=2`)).json();
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].materialName, 'Tinted glass');
  result = await (await fetch(`${base}?q=TINTED`)).json();
  assert.equal(result.total, 1);
  assert.equal((await (await fetch(`${base}?q=supplier`)).json()).total, 26);
  assert.equal((await (await fetch(`${base}?q=missing`)).json()).total, 0);
  for (const query of ['page=0', 'page=-1', 'page=1.5', 'page=9999999', 'q[x]=bad']) {
    assert.equal((await fetch(`${base}?${query}`)).status, 400);
  }
  response = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...valid, quantity: -1 }) });
  assert.equal(response.status, 400);
  assert.equal(records.length, 26);
});

test('database failures return actionable errors without saving a record', async () => {
  failDatabase = true;
  try {
    assert.equal((await fetch(base)).status, 500);
    const response = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(valid) });
    assert.equal(response.status, 500);
    assert.match((await response.json()).error, /Failed to save purchase/);
    assert.equal(records.length, 26);
  } finally { failDatabase = false; }
});


test('editing a purchase updates its costs, supplier and payment together', async () => {
  const response = await fetch(`${base}/1`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...valid, supplier: 'New supplier', unitPrice: '20', paymentStatus: 'PARTIAL', amountPaid: '10.25' }) });
  assert.equal(response.status, 200);
  const row = await response.json();
  assert.equal(row.totalCost, '51.5');
  assert.equal(row.supplier, 'New supplier');
  assert.equal(row.amountPaid, '10.25');
  assert.equal(row.paymentStatus, 'PARTIAL');
  const bad = await fetch(`${base}/1`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...valid, paymentStatus: 'PARTIAL', amountPaid: '9999' }) });
  assert.equal(bad.status, 400);
});
