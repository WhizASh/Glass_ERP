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
  console.log(`   ✅ dashboardService summary: Revenue=₹${summary.totalRevenue}, Active Quotes=${summary.activeQuotationsCount}`);

  const topProduce = await dashboardService.getTopProducedMaterials();
  assert.ok(Array.isArray(topProduce), "Top produced should be an array");
  console.log(`   ✅ Top produced glass types found: ${topProduce.length}`);

  const salesChart = await dashboardService.getSalesChart("month");
  assert.ok(Array.isArray(salesChart), "Sales chart should be an array");
  console.log(`   ✅ Sales chart data points: ${salesChart.length}`);

  const recentActivity = await dashboardService.getRecentActivity();
  assert.ok(recentActivity, "Recent activity should exist");
  assert.ok(Array.isArray(recentActivity.recentPurchases), "Recent purchases should be an array");
  assert.ok(Array.isArray(recentActivity.recentSales), "Recent sales should be an array");
  if (recentActivity.recentPurchases.length > 0) {
    assert.ok(recentActivity.recentPurchases[0].supplierName, "Recent purchase order should have supplierName");
  }
  if (recentActivity.recentSales.length > 0) {
    assert.ok(recentActivity.recentSales[0].customerName, "Recent quotation should have customerName");
  }
  console.log("   ✅ Recent activity contains formatted supplierName and customerName!");

  // 4. Test Express App Initialization
  console.log("4. Testing Express App & Route endpoints...");
  const app = require("../src/app");
  assert.ok(typeof app === "function", "App should be an Express application");
  console.log("   ✅ Express App initialized successfully!");

  // 5. Test Transactional Inventory Stock Operations
  console.log("5. Testing transactional inventoryService operations...");
  const inventoryService = require("../src/services/inventoryService");
  const testItem = inventory[0];
  const originalStock = testItem.stockQuantity;

  // Test purchase receipt in transaction
  const receiptMovements = await inventoryService.recordPurchaseReceipt(
    { id: "test-po-1", orderNumber: "PO-TEST-001" },
    [{ itemId: testItem.id, quantity: 5 }]
  );
  assert.strictEqual(receiptMovements.length, 1, "Should create 1 stock movement");
  assert.strictEqual(receiptMovements[0].quantity, 5, "Quantity should be 5");

  // Verify stock increased
  const itemAfterReceipt = await db.inventoryItem.findUnique({ where: { id: testItem.id } });
  assert.strictEqual(itemAfterReceipt.stockQuantity, originalStock + 5, "Stock should increment by 5");

  // Test quotation fulfillment in transaction
  const fulfillMovements = await inventoryService.fulfillQuotationStock(
    { id: "test-qt-1", quotationNumber: "QT-TEST-001" },
    [{ itemId: testItem.id, quantity: 3 }]
  );
  assert.strictEqual(fulfillMovements.length, 1, "Should create 1 fulfillment movement");
  assert.strictEqual(fulfillMovements[0].quantity, -3, "Fulfillment quantity should be -3");

  const itemAfterFulfill = await db.inventoryItem.findUnique({ where: { id: testItem.id } });
  assert.strictEqual(itemAfterFulfill.stockQuantity, originalStock + 2, "Stock should be original + 2");
  console.log("   ✅ db.$transaction inventory updates verified successfully!");

  // 6. Test Error Handler for P2003 Foreign Key Conflict
  console.log("6. Testing errorHandler for P2003 Foreign Key handling...");
  const errorHandler = require("../src/middlewares/errorHandler");
  let capturedStatus = null;
  let capturedBody = null;
  const mockRes = {
    status(code) {
      capturedStatus = code;
      return this;
    },
    json(body) {
      capturedBody = body;
      return this;
    }
  };
  const mockP2003Error = new Error("Foreign key constraint failed");
  mockP2003Error.code = "P2003";
  mockP2003Error.meta = { field_name: "customerId" };

  errorHandler(mockP2003Error, {}, mockRes, () => {});
  assert.strictEqual(capturedStatus, 409, "P2003 must return 409 Conflict");
  assert.strictEqual(capturedBody.success, false);
  assert.ok(capturedBody.message.includes("Cannot delete or update record"), "Message must explain conflict");
  console.log("   ✅ errorHandler P2003 returns 409 Conflict with clear message!");

  console.log("\n🎉 ALL BACKEND CHECKS AND UNIT TESTS PASSED SUCCESSFULLY!\n");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
