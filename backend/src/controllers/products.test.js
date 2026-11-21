const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

let products;
let transactionFailure;
const quotationItems = [{ productSkuId: 'quoted', unitPrice: 150 }];
const saleItems = [{ productSkuId: 'sold', unitPrice: 125 }];
const product = overrides => ({ id: 'unused', skuCode: 'GL-6', name: 'Clear glass', glassType: 'Float Glass', thicknessMm: 6, unitOfMeasure: 'SQ_METER', unitPrice: 100, description: 'Original notes', ...overrides });
const coded = code => Object.assign(new Error('Internal database detail'), { code });
const db = {
  quotationItem: {
    updateMany: async ({ where, data }) => {
      for (const item of quotationItems) {
        const matchesDescription = !where.OR || where.OR.some(condition =>
          condition.description === null ? item.description == null : item.description === condition.description);
        if (item.productSkuId === where.productSkuId && matchesDescription) Object.assign(item, data);
      }
    }
  },
  productSku: {
    findMany: async () => products,
    findUnique: async ({ where }) => products.find(row => row.id === where.id) || null,
    create: async ({ data }) => {
      if (products.some(row => row.skuCode === data.skuCode)) throw coded('P2002');
      const row = product({ ...data, id: 'created' });
      products.push(row);
      return row;
    },
    update: async ({ where, data }) => {
      const row = products.find(row => row.id === where.id);
      if (!row) throw coded('P2025');
      if (products.some(other => other.id !== where.id && other.skuCode === data.skuCode)) throw coded('P2002');
      Object.assign(row, data);
      return row;
    },
    deleteMany: async ({ where }) => {
      const removable = row => row.id === where.id &&
        (!where.quoteItems?.none || !quotationItems.some(item => item.productSkuId === row.id)) &&
        (!where.saleItems?.none || !saleItems.some(item => item.productSkuId === row.id));
      const previous = products.length;
      products = products.filter(row => !removable(row));
      return { count: previous - products.length };
    }
  },
  $transaction: async callback => {
    if (transactionFailure) throw coded(transactionFailure);
    const originalProducts = structuredClone(products);
    const originalItems = structuredClone(quotationItems);
    try { return await callback(db); }
    catch (error) {
      products = originalProducts;
      quotationItems.splice(0, quotationItems.length, ...originalItems);
      throw error;
    }
  }
};
require.cache[require.resolve('../lib/prisma')] = { exports: db };
const app = require('express')();
app.use(require('express').json());
app.use('/products', require('../routes/products.routes'));
let server;
let base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
beforeEach(() => {
  products = [product(), product({ id: 'quoted', skuCode: 'QUOTED' }), product({ id: 'sold', skuCode: 'SOLD' })];
  quotationItems.splice(0, quotationItems.length, { productSkuId: 'quoted', unitPrice: 150 });
  transactionFailure = null;
});
const send = (path, method, body) => fetch(base + path, {
  method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body)
});

test('editing updates every catalog field, accepts zero price, and preserves document line prices', async () => {
  const response = await send('/products/unused', 'PUT', product({ skuCode: ' NEW-8 ', name: ' New name ', glassType: 'Toughened Glass', thicknessMm: '8.5', unitOfMeasure: 'PCS', unitPrice: '0', description: ' New notes ' }));
  assert.equal(response.status, 200);
  const row = await response.json();
  assert.equal(row.id, 'unused');
  assert.equal(row.skuCode, 'NEW-8');
  assert.equal(row.name, 'New name');
  assert.equal(row.glassType, 'Toughened Glass');
  assert.equal(row.thicknessMm, 8.5);
  assert.equal(row.unitOfMeasure, 'PCS');
  assert.equal(row.unitPrice, 0);
  assert.equal(row.description, 'New notes');
  assert.equal((await send('/products/quoted', 'PUT', product({ skuCode: 'QUOTED', unitPrice: '200' }))).status, 200);
  assert.deepEqual(quotationItems, [{ productSkuId: 'quoted', unitPrice: 150 }]);
  assert.deepEqual(saleItems, [{ productSkuId: 'sold', unitPrice: 125 }]);
});

test('duplicate SKU and missing product updates return actionable conflict and not-found errors', async () => {
  const before = JSON.stringify(products);
  let response = await send('/products/unused', 'PUT', product({ skuCode: 'QUOTED' }));
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /already exists/);
  assert.equal(JSON.stringify(products), before);
  response = await send('/products/missing', 'PUT', product());
  assert.equal(response.status, 404);
});

test('invalid edits are rejected before changing catalog data', async () => {
  const before = JSON.stringify(products);
  for (const body of [null, [], {}, product({ name: ' ' }), product({ skuCode: {} }), product({ glassType: false }),
    product({ thicknessMm: 'bad' }), product({ thicknessMm: 0 }), product({ thicknessMm: true }),
    product({ unitPrice: -1 }), product({ unitPrice: 'Infinity' }), product({ unitPrice: '' }), product({ unitPrice: null }),
    product({ unitOfMeasure: 'INVALID' }), product({ description: {} })]) {
    assert.equal((await send('/products/unused', 'PUT', body)).status, 400, JSON.stringify(body));
  }
  assert.equal(JSON.stringify(products), before);
});

test('deleting an unused SKU removes it and repeated deletion returns 404', async () => {
  assert.equal((await send('/products/unused', 'DELETE')).status, 200);
  assert.deepEqual(products.map(row => row.id), ['quoted', 'sold']);
  assert.equal((await send('/products/unused', 'DELETE')).status, 404);
});

test('deletion protects both quotation and sales links without removing products or document lines', async () => {
  const before = JSON.stringify(products);
  for (const id of ['quoted', 'sold']) {
    const response = await send(`/products/${id}`, 'DELETE');
    assert.equal(response.status, 409);
    assert.match((await response.json()).error, /used in a quotation or sales order/);
  }
  assert.equal(JSON.stringify(products), before);
  assert.deepEqual(quotationItems, [{ productSkuId: 'quoted', unitPrice: 150 }]);
  assert.deepEqual(saleItems, [{ productSkuId: 'sold', unitPrice: 125 }]);
});

test('foreign-key races and serialization conflicts return retryable conflicts', async () => {
  for (const code of ['P2003', 'P2034']) {
    transactionFailure = code;
    const response = await send('/products/unused', 'DELETE');
    assert.equal(response.status, 409);
    assert.doesNotMatch((await response.json()).error, /Internal database detail/);
    assert.ok(products.some(row => row.id === 'unused'));
  }
});

test('create keeps working with shared validation and handles duplicate SKU codes', async () => {
  const body = product({ skuCode: 'NEW', description: '' });
  delete body.unitOfMeasure;
  let response = await send('/products', 'POST', body);
  assert.equal(response.status, 201);
  const created = await response.json();
  assert.equal(created.unitOfMeasure, 'SQ_METER');
  assert.equal(created.description, null);
  response = await send('/products', 'POST', body);
  assert.equal(response.status, 409);
  assert.equal((await send('/products', 'POST', { ...body, unitPrice: -1 })).status, 400);
});

test('quick-create and edits preserve existing SQ_FT catalog units and custom glass categories', async () => {
  const body = product({ skuCode: 'QUICK', glassType: 'Toughened', unitOfMeasure: 'SQ_FT', thicknessMm: 12 });
  let response = await send('/products', 'POST', body);
  assert.equal(response.status, 201);
  const created = await response.json();
  assert.equal(created.unitOfMeasure, 'SQ_FT');
  response = await send(`/products/${created.id}`, 'PUT', { ...created, name: 'Renamed quick product' });
  assert.equal(response.status, 200);
  const updated = await response.json();
  assert.equal(updated.unitOfMeasure, 'SQ_FT');
  assert.equal(updated.glassType, 'Toughened');
  assert.equal(updated.name, 'Renamed quick product');
});

test('specification edits snapshot older quotation lines and keep existing saved specifications', async () => {
  quotationItems.push({ productSkuId: 'quoted', description: 'Recorded custom glass specification', unitPrice: 175 });
  const response = await send('/products/quoted', 'PUT', product({ skuCode: 'QUOTED', name: 'New glass', thicknessMm: 12, glassType: 'Toughened Glass' }));
  assert.equal(response.status, 200);
  assert.equal(quotationItems[0].description, 'Clear glass (6mm - Float Glass)');
  assert.equal(quotationItems[0].unitPrice, 150);
  assert.equal(quotationItems[1].description, 'Recorded custom glass specification');
  assert.equal(quotationItems[1].unitPrice, 175);
  assert.equal(products.find(row => row.id === 'quoted').name, 'New glass');
});

test('failed specification edits roll back quotation snapshots along with the catalog change', async () => {
  const beforeProducts = structuredClone(products);
  const beforeItems = structuredClone(quotationItems);
  const response = await send('/products/quoted', 'PUT', product({ skuCode: 'SOLD', name: 'Conflicting renamed glass', thicknessMm: 12 }));
  assert.equal(response.status, 409);
  assert.deepEqual(products, beforeProducts);
  assert.deepEqual(quotationItems, beforeItems);
});
