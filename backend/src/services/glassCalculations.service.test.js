const assert = require('assert');
const {
  roundDimensionTo6Inches,
  calculateItemSqft,
  formatBillingSize,
  calculateDiscount,
  calculateQuotationTotals
} = require('./glassCalculations.service');

console.log('🧪 Testing Backend Glass Calculations Service...');

// Test 1: 6-Inch Rounding
assert.strictEqual(roundDimensionTo6Inches(57), 60);
assert.strictEqual(roundDimensionTo6Inches(44), 48);
assert.strictEqual(roundDimensionTo6Inches(76.5), 78);
assert.strictEqual(roundDimensionTo6Inches(60), 60);
assert.strictEqual(roundDimensionTo6Inches(4), 6);
assert.strictEqual(roundDimensionTo6Inches(0), 0);
console.log('  ✓ 6-inch rounding tests passed');

// Test 2: Sqft Calculations
assert.strictEqual(calculateItemSqft(57, 44), 20.00);
assert.strictEqual(calculateItemSqft(76.5, 56.5), 32.50);
assert.strictEqual(calculateItemSqft(34, 51), 13.50);
assert.strictEqual(formatBillingSize(57, 44), '60" × 48"');
console.log('  ✓ Sqft calculation tests passed');

// Test 3: Discount Calculations
assert.strictEqual(calculateDiscount(100000, 'PERCENTAGE', 5), 5000);
assert.strictEqual(calculateDiscount(10000, 'FIXED', 2500), 2500);
assert.strictEqual(calculateDiscount(2000, 'FIXED', 3000), 2000);
console.log('  ✓ Discount calculation tests passed');

// Test 4: Totals & Tax
const totals = calculateQuotationTotals({
  subtotal: 12500,
  discountType: 'PERCENTAGE',
  discountValue: 10,
  taxRate: 18
});
assert.strictEqual(totals.subtotal, 12500);
assert.strictEqual(totals.discountAmount, 1250);
assert.strictEqual(totals.taxAmount, 2025);
assert.strictEqual(totals.totalAmount, 13275);
console.log('  ✓ Totals and tax calculation tests passed');

// Test 5: Sales Order Line Item Glass Sqft Calculation (Testing 57" × 44", qty 2 @ ₹120/sqft)
const w = 57;
const h = 44;
const qty = 2;
const rate = 120;
const sqftPerPiece = calculateItemSqft(w, h); // 20.00 sqft
const totalSqft = Number((sqftPerPiece * qty).toFixed(2)); // 40.00 sqft
const lineTotal = Number((totalSqft * rate).toFixed(2)); // ₹4,800.00 (not ₹240 as in old default 1 sqft bug)
assert.strictEqual(sqftPerPiece, 20.00);
assert.strictEqual(totalSqft, 40.00);
assert.strictEqual(lineTotal, 4800.00);
console.log('  ✓ Sales order total sqft pricing tests passed (verified 40 sqft * ₹120 = ₹4,800)');

console.log('✅ All backend calculation tests passed successfully!');
