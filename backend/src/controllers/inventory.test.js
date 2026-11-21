const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { inventoryDatabase } = require('../test-support/inventory-db');
const { parseInventory } = require('../services/inventory.service');
const db = inventoryDatabase();
require.cache[require.resolve('../lib/prisma')] = { exports: db };
const app = require('express')();
app.use(require('express').json());
app.use('/inventory', require('../routes/inventory.routes'));
app.use('/purchases', require('../routes/purchases.routes'));
let server;
let base;
before(async () => {
  server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
const send = (path, method, body) => fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const list = async () => (await (await fetch(`${base}/inventory`)).json()).records;
const purchase = (overrides = {}) => ({ materialName: '6mm clear glass', quantity: '0.100', unitOfMeasure: 'SQ_FEET', supplier: 'Supplier A', purchaseDate: '2026-11-21', unitPrice: '10', ...overrides });

test('inventory validation accepts zero and rejects malformed stock, units and text', () => {
  const valid = { materialName: ' Clear   glass ', quantity: '0', unitOfMeasure: 'PCS' };
  const parsed = parseInventory(valid);
  assert.equal(parsed.nameKey, 'clear glass');
  assert.equal(parsed.quantity.toString(), '0');
  for (const data of [null, [], { ...valid, materialName: '' }, { ...valid, materialName: 'x'.repeat(201) }, { ...valid, notes: {} }, { ...valid, unitOfMeasure: 'SQ_FT' }, ...['-1', '1.0001', '1e3', '', true, null, '1000000000000000'].map(quantity => ({ ...valid, quantity }))]) {
    assert.throws(() => parseInventory(data));
  }
});

test('purchases merge names across suppliers, keep units separate, and apply edit deltas once', async () => {
  const firstResponse = await send('/purchases', 'POST', purchase());
  assert.equal(firstResponse.status, 201);
  const first = await firstResponse.json();
  const secondResponse = await send('/purchases', 'POST', purchase({ materialName: ' 6MM   clear glass ', quantity: '0.200', supplier: 'Supplier B' }));
  assert.equal(secondResponse.status, 201);
  const second = await secondResponse.json();
  assert.equal(first.inventoryItemId, second.inventoryItemId);
  let items = await list();
  assert.equal(items.length, 1);
  assert.equal(items[0].quantity, '0.3');
  assert.equal(items[0]._count.purchases, 2);
  const path = `/purchases/${first.id}`;
  assert.equal((await send(path, 'PUT', purchase({ quantity: '0.150' }))).status, 200);
  assert.equal((await list())[0].quantity, '0.35');
  assert.equal((await send(path, 'PUT', purchase({ quantity: '0.150', supplier: 'Other supplier', unitPrice: '20' }))).status, 200);
  assert.equal((await list())[0].quantity, '0.35');
  assert.equal((await send('/purchases', 'POST', purchase({ quantity: '2', unitOfMeasure: 'PCS' }))).status, 201);
  items = await list();
  assert.equal(items.length, 2);
  assert.equal(items.find(row => row.unitOfMeasure === 'PCS').quantity, '2');
  // Moving the purchase to a different material reverses only its contribution.
  assert.equal((await send(path, 'PUT', purchase({ materialName: 'Frosted glass', quantity: '1' }))).status, 200);
  items = await list();
  assert.equal(items.find(row => row.id === first.inventoryItemId).quantity, '0.2');
  assert.equal(items.find(row => row.materialName === 'Frosted glass').quantity, '1');
});

test('manual edits preserve future purchase additions and reject stale saves, unsafe removals and negative stock', async () => {
  let item = (await list()).find(row => row.materialName === 'Frosted glass');
  const path = `/inventory/${item.id}`;
  assert.equal((await send(path, 'PUT', { ...item, quantity: '0.5' })).status, 200);
  assert.equal((await send(path, 'PUT', { ...item, quantity: '9' })).status, 409);
  item = (await list()).find(row => row.id === item.id);
  assert.equal((await send(path, 'DELETE', { revision: item.revision })).status, 409);
  assert.equal((await send(path, 'PUT', { ...item, unitOfMeasure: 'KG' })).status, 409);
  const linkedPurchase = db.purchases.find(row => row.inventoryItemId === item.id);
  const before = JSON.stringify(db.purchases);
  assert.equal((await send(`/purchases/${linkedPurchase.id}`, 'PUT', purchase({ materialName: 'Different material', quantity: '1' }))).status, 409);
  assert.equal(JSON.stringify(db.purchases), before);
  assert.equal((await list()).some(row => row.materialName === 'Different material'), false);
  assert.equal((await send('/purchases', 'POST', purchase({ materialName: 'Frosted glass', quantity: '0.3' }))).status, 201);
  assert.equal((await list()).find(row => row.id === item.id).quantity, '0.8');
});

test('manual items can be created, renamed and deleted; duplicate names and stale deletes are rejected', async () => {
  let response = await send('/inventory', 'POST', { materialName: 'Packing tape', unitOfMeasure: 'PCS', quantity: '5' });
  assert.equal(response.status, 201);
  let item = await response.json();
  const path = `/inventory/${item.id}`;
  assert.equal((await send('/inventory', 'POST', { ...item, materialName: ' PACKING  tape ' })).status, 409);
  response = await send(path, 'PUT', { ...item, materialName: 'Safety gloves', unitOfMeasure: 'KG', quantity: '0', notes: 'Store A' });
  assert.equal(response.status, 200);
  assert.equal((await send(path, 'DELETE', { revision: item.revision })).status, 409);
  item = await response.json();
  assert.equal((await send(path, 'DELETE', { revision: item.revision })).status, 200);
  assert.equal((await send(path, 'DELETE', { revision: item.revision })).status, 404);
});

test('inventory search, pagination, missing records and database failures return useful responses', async () => {
  for (let n = 0; n < 26; n++) assert.equal((await send('/inventory', 'POST', { materialName: `Packing ${n}`, unitOfMeasure: 'PCS', quantity: '0' })).status, 201);
  const page = await (await fetch(`${base}/inventory?q=PACKING&page=2`)).json();
  assert.equal(page.total, 26);
  assert.equal(page.records.length, 1);
  for (const query of ['page=0', 'page=1.5', 'q[x]=bad']) assert.equal((await fetch(`${base}/inventory?${query}`)).status, 400);
  assert.equal((await send('/inventory/missing', 'PUT', { materialName: 'Missing', unitOfMeasure: 'PCS', quantity: 0, revision: 0 })).status, 404);
  assert.equal((await send('/purchases/missing', 'PUT', purchase())).status, 404);
  const before = JSON.stringify(db.items);
  db.failDatabase = true;
  try {
    assert.equal((await fetch(`${base}/inventory`)).status, 500);
    assert.equal((await send('/purchases', 'POST', purchase({ materialName: 'New material' }))).status, 500);
    assert.equal(JSON.stringify(db.items), before);
  } finally { db.failDatabase = false; }
});

test('stock capacity errors roll back the purchase and preserve the existing total', async () => {
  const response = await send('/inventory', 'POST', { materialName: 'Bulk material', unitOfMeasure: 'KG', quantity: '999999999999999.999' });
  assert.equal(response.status, 201);
  const item = await response.json();
  const before = db.purchases.length;
  const failed = await send('/purchases', 'POST', purchase({ materialName: 'Bulk material', unitOfMeasure: 'KG', quantity: '0.001' }));
  assert.equal(failed.status, 409);
  assert.equal(db.purchases.length, before);
  assert.equal((await db.inventoryItem.findUnique({ where: { id: item.id } })).quantity.toString(), '999999999999999.999');
});
