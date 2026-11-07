const assert = require('assert');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Glass ERP Sales API & Integration Test Suite...');

  // 1. Test Dashboard Stats
  console.log('• Test 1: GET /api/dashboard/stats');
  const dashRes = await fetch(`${API_BASE}/dashboard/stats`);
  assert.strictEqual(dashRes.status, 200, 'Dashboard endpoint should return 200');
  const dashData = await dashRes.json();
  assert.ok(dashData.kpis, 'Dashboard should have kpis');
  assert.ok(Array.isArray(dashData.trendData), 'trendData should be an array');
  assert.ok(dashData.trendData.length > 0, 'trendData should not be empty');
  console.log('  ✓ Dashboard statistics and trend data verified.');

  // 2. Test Quotations
  console.log('• Test 2: GET /api/quotations');
  const quotesRes = await fetch(`${API_BASE}/quotations`);
  assert.strictEqual(quotesRes.status, 200);
  const quotes = await quotesRes.json();
  assert.ok(Array.isArray(quotes) && quotes.length >= 3, 'Should have at least 3 quotations');
  const quote201 = quotes.find(q => q.quoteNumber === '201' || q.id === 'quote-sample-facade-01');
  assert.ok(quote201, 'Quote #201 should exist in database');
  console.log(`  ✓ Found ${quotes.length} quotations in DB, including Invoice #201.`);

  // 3. Test Create Sale with Invoice #201
  console.log('• Test 3: POST /api/sales (From Invoice #201)');
  const createFromQuoteRes = await fetch(`${API_BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId: quote201.customerId,
      quotationId: quote201.id,
      paymentMode: 'ONLINE',
      paymentStatus: 'UNPAID',
      status: 'PENDING',
      deliveryAddress: 'Plot 42, Civil Lines, Nagpur',
      items: [
        {
          sectionName: 'Ground Floor Elevation',
          description: '12mm Clear Toughened Architectural Glass (57" × 44")',
          quantity: 2,
          unitPrice: 185
        }
      ]
    })
  });
  assert.strictEqual(createFromQuoteRes.status, 201, 'Should create sale order from quotation');
  const createdSale = await createFromQuoteRes.json();
  assert.ok(createdSale.id, 'Created sale should have an id');
  assert.strictEqual(createdSale.quotationId, quote201.id);
  assert.strictEqual(createdSale.paymentMode, 'ONLINE');
  assert.strictEqual(createdSale.totalAmount, 370);
  console.log(`  ✓ Created Sale Order ${createdSale.orderNumber} referencing Invoice #201.`);

  // 4. Test Create Sale (Direct Order without quotation)
  console.log('• Test 4: POST /api/sales (Direct Order - No Invoice)');
  const createDirectRes = await fetch(`${API_BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId: quote201.customerId,
      quotationId: null,
      paymentMode: 'CASH',
      paymentStatus: 'PARTIAL',
      status: 'PENDING',
      deliveryAddress: 'Direct Site Walk-in',
      items: [
        {
          description: 'Custom 8mm Beveled Glass Panel',
          quantity: 4,
          unitPrice: 250
        }
      ]
    })
  });
  assert.strictEqual(createDirectRes.status, 201);
  const directSale = await createDirectRes.json();
  assert.strictEqual(directSale.quotationId, null);
  assert.strictEqual(directSale.totalAmount, 1000);
  console.log(`  ✓ Created Direct Sale Order ${directSale.orderNumber} (₹1,000).`);

  // 5. Test Invalid Customer Rejection
  console.log('• Test 5: POST /api/sales with invalid customerId');
  const invalidCustRes = await fetch(`${API_BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId: 'non-existent-customer-uuid',
      items: [{ description: 'Glass', quantity: 1, unitPrice: 100 }]
    })
  });
  assert.strictEqual(invalidCustRes.status, 400, 'Should return 400 for non-existent customer');
  const invalidCustData = await invalidCustRes.json();
  assert.ok(invalidCustData.error.includes('Selected customer does not exist'));
  console.log('  ✓ Cleanly rejected non-existent customer with 400 error.');

  // 6. Test Invalid Quotation Rejection
  console.log('• Test 6: POST /api/sales with invalid quotationId');
  const invalidQuoteRes = await fetch(`${API_BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId: quote201.customerId,
      quotationId: 'non-existent-quote-uuid',
      items: [{ description: 'Glass', quantity: 1, unitPrice: 100 }]
    })
  });
  assert.strictEqual(invalidQuoteRes.status, 400, 'Should return 400 for non-existent quotation');
  const invalidQuoteData = await invalidQuoteRes.json();
  assert.ok(invalidQuoteData.error.includes('Selected quotation does not exist'));
  console.log('  ✓ Cleanly rejected non-existent quotation with 400 error.');

  // 7. Test Update Sale Order
  console.log('• Test 7: PUT /api/sales/:id (Edit Order)');
  const updateRes = await fetch(`${API_BASE}/sales/${createdSale.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentMode: 'CASH',
      paymentStatus: 'PAID',
      status: 'IN_PRODUCTION',
      deliveryAddress: 'Updated Dispatch Warehouse, Nagpur',
      items: [
        {
          description: '12mm Clear Toughened Architectural Glass (57" × 44")',
          quantity: 5,
          unitPrice: 185
        }
      ]
    })
  });
  assert.strictEqual(updateRes.status, 200, 'Should update sale order');
  const updatedSale = await updateRes.json();
  assert.strictEqual(updatedSale.paymentMode, 'CASH');
  assert.strictEqual(updatedSale.paymentStatus, 'PAID');
  assert.strictEqual(updatedSale.status, 'IN_PRODUCTION');
  assert.strictEqual(updatedSale.deliveryAddress, 'Updated Dispatch Warehouse, Nagpur');
  assert.strictEqual(updatedSale.totalAmount, 925); // 5 * 185
  console.log(`  ✓ Updated Sale Order ${updatedSale.orderNumber}: total recalculated to ₹925.`);

  // 8. Test Cancelled Order Guardrail
  console.log('• Test 8: Guardrail on CANCELLED order modification');
  // Cancel the order first
  await fetch(`${API_BASE}/sales/${createdSale.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'CANCELLED' })
  });

  // Attempt to edit cancelled order
  const editCancelledRes = await fetch(`${API_BASE}/sales/${createdSale.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentStatus: 'PAID' })
  });
  assert.strictEqual(editCancelledRes.status, 400, 'Should reject modification on CANCELLED order');
  const cancelErrData = await editCancelledRes.json();
  assert.strictEqual(cancelErrData.error, 'Cancelled orders cannot be modified');
  console.log('  ✓ Verified CANCELLED order guardrail blocks modification.');

  console.log('\n========================================');
  console.log('🎉 ALL SALES API INTEGRATION TESTS PASSED!');
  console.log('========================================');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
