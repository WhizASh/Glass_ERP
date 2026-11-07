import {
  roundDimensionTo6Inches,
  calculateItemSqft,
  formatBillingSize,
  calculateDiscount,
  calculateLineItemMetrics,
  calculateQuotationTotals,
  formatCurrency,
  formatSqft,
  getItemDisplayMetrics
} from './glassCalculations.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    failed++;
  }
}

function assertEquals(actual, expected, message) {
  if (actual === expected) {
    console.log(`  PASS: ${message} (Expected: ${expected}, Got: ${actual})`);
    passed++;
  } else {
    console.error(`  FAIL: ${message} (Expected: ${expected}, Got: ${actual})`);
    failed++;
  }
}

console.log('=== Test Suite 1: Inch-Based 6-Inch Rounding ===');
assertEquals(roundDimensionTo6Inches(57), 60, '57" rounds to 60"');
assertEquals(roundDimensionTo6Inches(44), 48, '44" rounds to 48"');
assertEquals(roundDimensionTo6Inches(76.5), 78, '76.5" rounds to 78"');
assertEquals(roundDimensionTo6Inches(56.5), 60, '56.5" rounds to 60"');
assertEquals(roundDimensionTo6Inches(34), 36, '34" rounds to 36"');
assertEquals(roundDimensionTo6Inches(51), 54, '51" rounds to 54"');
assertEquals(roundDimensionTo6Inches(60), 60, '60" stays 60"');
assertEquals(roundDimensionTo6Inches(4), 6, '4" clamps to min 6"');
assertEquals(roundDimensionTo6Inches(0), 0, '0 returns 0');

console.log('\n=== Test Suite 2: Square Footage (Sqft) Calculations ===');
assertEquals(calculateItemSqft(57, 44), 20.00, '57" x 44" -> 20.00 sqft');
assertEquals(calculateItemSqft(76.5, 56.5), 32.50, '76.5" x 56.5" -> 32.50 sqft');
assertEquals(calculateItemSqft(34, 51), 13.50, '34" x 51" -> 13.50 sqft');
assertEquals(calculateItemSqft(60, 48), 20.00, '60" x 48" -> 20.00 sqft');
assertEquals(formatBillingSize(57, 44), '60" × 48"', 'Billing size text for 57" x 44"');

console.log('\n=== Test Suite 3: Discount Modifier Calculations ===');
// Percentage Discount: 5% on 100,000 = 5000
assertEquals(calculateDiscount(100000, 'PERCENTAGE', 5), 5000, '5% discount on 100,000 is 5,000');
assertEquals(calculateDiscount(100000, '%', 5), 5000, '% modifier discount on 100,000 is 5,000');
// Fixed Discount: 2500 on 10,000 = 2500
assertEquals(calculateDiscount(10000, 'FIXED', 2500), 2500, 'Fixed 2,500 discount on 10,000 is 2,500');
// Capped at subtotal
assertEquals(calculateDiscount(2000, 'FIXED', 5000), 2000, 'Fixed discount capped at subtotal');
// 0 discount
assertEquals(calculateDiscount(50000, 'PERCENTAGE', 0), 0, '0% discount returns 0');

console.log('\n=== Test Suite 4: Commercial Quotation Totals ===');
const sampleSections = [
  {
    sectionName: '1st Floor',
    items: [
      {
        widthInches: 57,
        heightInches: 44,
        quantity: 2,
        unitPrice: 150 // 20.00 sqft * 2 = 40 sqft * 150 = 6,000
      }
    ]
  },
  {
    sectionName: '2nd Floor Facade',
    items: [
      {
        widthInches: 76.5,
        heightInches: 56.5,
        quantity: 1,
        unitPrice: 200 // 32.50 sqft * 1 = 32.50 sqft * 200 = 6,500
      }
    ]
  }
];

// Total Sqft = 40.00 + 32.50 = 72.50 sqft
// Subtotal = 6000 + 6500 = 12500
// Discount 10% = 1250
// Taxable = 11250
// GST (18%) = 2025
// Grand Total = 13275
const totals = calculateQuotationTotals(sampleSections, 'PERCENTAGE', 10, 18);
assertEquals(totals.totalSqft, 72.50, 'Total Sqft is 72.50');
assertEquals(totals.subtotal, 12500, 'Fabrication Subtotal is 12,500');
assertEquals(totals.discountAmount, 1250, 'Discount amount is 1,250');
assertEquals(totals.taxableSubtotal, 11250, 'Taxable Subtotal is 11,250');
assertEquals(totals.taxAmount, 2025, 'GST (18%) is 2,025');
assertEquals(totals.grandTotal, 13275, 'Grand Total is 13,275');

console.log('\n=== Test Suite 5: Currency & Sqft Formatting ===');
assertEquals(formatSqft(20), '20.00', 'Sqft formatted with 2 decimal places');
assert(formatCurrency(112100).includes('1,12,100'), 'Currency formats with Indian locale');

console.log('\n=== Test Suite 6: Item Display Metrics (Drawer & Print) ===');
const inchItem = { widthInches: 57, heightInches: 44, quantity: 2, unitPrice: 150 };
const metricsInch = getItemDisplayMetrics(inchItem);
assertEquals(metricsInch.cutSize, '57" × 44"', 'Inch item cut size matches 57" × 44"');
assertEquals(metricsInch.billingSize, '60" × 48"', 'Inch item billing size rounds to 60" × 48"');
assertEquals(metricsInch.sqft, 20.00, 'Inch item sqft per piece is 20.00');
assertEquals(metricsInch.totalSqft, 40.00, 'Inch item total sqft for qty 2 is 40.00');

const mmItem = { widthMm: 1200, heightMm: 800, quantity: 1, unitPrice: 200 };
const metricsMm = getItemDisplayMetrics(mmItem);
assert(metricsMm.cutSize.includes('1200') || metricsMm.cutSize.includes('"'), 'Mm item provides cut size');
assert(metricsMm.billingSize !== '—', 'Mm item converts and calculates billing size');
assert(metricsMm.sqft > 0, 'Mm item calculates sqft');

console.log(`\n========================================`);
console.log(`Summary: ${passed} passed, ${failed} failed`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests PASSED successfully!\n');
}
