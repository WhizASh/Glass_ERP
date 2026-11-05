// Verification test script for Glass ERP Backend
const assert = require("assert");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

async function runTests() {
  console.log("🧪 Testing Glass ERP Backend Modules...");

  const { verifyDbConnection, db } = require("../src/config/db");
  await verifyDbConnection();

  // 1. Test Glass Calculation Service
  console.log("1. Testing glassCalculationService...");
  const glassMath = require("../src/services/glassCalculationService");

  // Area calculation: 1500mm x 900mm = 1.35 m2
  const area = glassMath.calculateAreaSqM(1500, 900);
  assert.strictEqual(area, 1.35, "Area should be 1.35 m2");

  // Perimeter calculation: 2 * (1500 + 900) / 1000 = 4.8 m
  const perimeter = glassMath.calculatePerimeterM(1500, 900);
  assert.strictEqual(perimeter, 4.8, "Perimeter should be 4.8 m");

  // Weight calculation: 1.35 * 10 * 2.5 = 33.75 kg
  const weight = glassMath.calculateWeightKg(1.35, 10);
  assert.strictEqual(weight, 33.75, "Weight should be 33.75 kg");

  // Single Item Pricing Test
  const pricing = glassMath.calculateItemPricing({
    widthMm: 1500,
    heightMm: 900,
    thicknessMm: 10,
    glassType: "TOUGHENED_TEMPERED",
    edgeWork: "FLAT_POLISH",
    holesCount: 2,
    quantity: 3
  });
  assert.ok(pricing.areaSqM === 1.35);
  assert.ok(pricing.perimeterM === 4.8);
  assert.ok(pricing.baseRate > 0);
  assert.ok(pricing.edgeCost > 0);
  assert.ok(pricing.holesCost > 0);
  assert.ok(pricing.unitPrice > 0);
  assert.strictEqual(pricing.quantity, 3);
  assert.strictEqual(pricing.lineTotal, Number((pricing.unitPrice * 3).toFixed(2)));
  console.log("   ✅ glassCalculationService passed all assertions!");

  // 2. Test DB & Store
  console.log("2. Testing DB & Store...");

  const customers = await db.customer.findMany();
  assert.ok(customers.length >= 1, "Should have customers");
  console.log(`   ✅ DB customer query passed! Total customers: ${customers.length}`);

  const inventory = await db.inventoryItem.findMany();
  assert.ok(inventory.length >= 1, "Should have inventory items");
  console.log(`   ✅ DB inventory query passed! Total items: ${inventory.length}`);

  const quotations = await db.quotation.findMany();
  assert.ok(quotations.length >= 1, "Should have quotations");
  console.log(`   ✅ DB quotation query passed! Total quotations: ${quotations.length}`);

  // Test relation fetching
  const quoteWithRelations = await db.quotation.findUnique({
    where: { id: quotations[0].id },
    include: { customer: true, items: true }
  });
  assert.ok(quoteWithRelations, "Quote should be found");
  assert.ok(quoteWithRelations.customer, "Quote customer relation should be populated");
  assert.ok(Array.isArray(quoteWithRelations.items), "Quote items should be an array");
  console.log("   ✅ DB relations passed!");

  // 3. Test Dashboard Service
  console.log("3. Testing dashboardService...");
  const dashboardService = require("../src/services/dashboardService");

  const summary = await dashboardService.getSummary();
  assert.ok(summary, "Summary should exist");
  assert.ok(typeof summary.totalRevenue === "number", "Total revenue should be numeric");
  assert.ok(typeof summary.activeQuotationsCount === "number", "Active quotations should be numeric");
  console.log(`   ✅ dashboardService summary: Revenue=$${summary.totalRevenue}, Active Quotes=${summary.activeQuotationsCount}`);

  const topProduce = await dashboardService.getTopProducedMaterials();
  assert.ok(Array.isArray(topProduce), "Top produced should be an array");
  console.log(`   ✅ Top produced glass types found: ${topProduce.length}`);

  const salesChart = await dashboardService.getSalesChart("month");
  assert.ok(Array.isArray(salesChart), "Sales chart should be an array");
  console.log(`   ✅ Sales chart data points: ${salesChart.length}`);

  // 4. Test Express App Initialization
  console.log("4. Testing Express App & Route endpoints...");
  const app = require("../src/app");
  assert.ok(typeof app === "function", "App should be an Express application");
  console.log("   ✅ Express App initialized successfully!");

  console.log("\n🎉 ALL BACKEND CHECKS AND UNIT TESTS PASSED SUCCESSFULLY!\n");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
