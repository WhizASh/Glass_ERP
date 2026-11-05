// Integration Test for Glass ERP REST API Endpoints
const http = require("http");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const app = require("../src/app");

function request(server, reqPath, method = "GET", body = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const options = {
      hostname: "127.0.0.1",
      port: address.port,
      path: reqPath,
      method,
      headers: {
        "Content-Type": "application/json"
      }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runApiTests() {
  console.log("🌐 Starting REST API Integration Tests...");
  const { verifyDbConnection } = require("../src/config/db");
  await verifyDbConnection();

  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Test server running on port ${port}`);

  try {
    // 1. Health check
    console.log("1. GET /api/health");
    const health = await request(server, "/api/health");
    if (health.status !== 200 || (health.data.status !== "ok" && !health.data.success)) {
      throw new Error(`Health check failed: ${JSON.stringify(health)}`);
    }
    console.log("   ✅ Health endpoint OK!");

    // 2. Dashboard summary
    console.log("2. GET /api/dashboard/summary");
    const dash = await request(server, "/api/dashboard/summary");
    if (dash.status !== 200 || !dash.data.success) {
      throw new Error(`Dashboard summary failed: ${JSON.stringify(dash)}`);
    }
    console.log("   ✅ Dashboard summary returned KPIs successfully!");

    // 3. Customers
    console.log("3. GET /api/customers & POST /api/customers");
    const customers = await request(server, "/api/customers");
    if (customers.status !== 200 || !customers.data.success) {
      throw new Error(`Customers get failed: ${JSON.stringify(customers)}`);
    }

    const newCust = await request(server, "/api/customers", "POST", {
      type: "ORGANIZATION",
      name: "Apex Facades Ltd",
      companyName: "Apex Facades Ltd",
      gstin: "27AAACA9999Z1Z5",
      phone: "+91-9876543299",
      email: "contact@apexfacades.com",
      billingAddress: "404 Industrial Park",
      shippingAddress: "Site B, Sky Tower"
    });
    if (newCust.status !== 201 || !newCust.data.success) {
      throw new Error(`Customer create failed: ${JSON.stringify(newCust)}`);
    }
    console.log("   ✅ Customer endpoints OK!");

    // 4. Inventory
    console.log("4. GET /api/inventory & POST /api/inventory/:id/adjust");
    const items = await request(server, "/api/inventory");
    if (items.status !== 200 || !items.data.success) {
      throw new Error(`Inventory get failed: ${JSON.stringify(items)}`);
    }
    const firstItem = items.data.data[0];

    const adjust = await request(server, `/api/inventory/${firstItem.id}/adjust`, "POST", {
      quantity: -2,
      reason: "SCRAP_BREAKAGE",
      notes: "Handling edge chip during furnace loading"
    });
    if (adjust.status !== 200 || !adjust.data.success) {
      throw new Error(`Inventory adjust failed: ${JSON.stringify(adjust)}`);
    }
    console.log("   ✅ Inventory & Stock adjustment endpoints OK!");

    // 5. Quotation calculation and creation
    console.log("5. POST /api/quotations/calculate & POST /api/quotations");
    const calc = await request(server, "/api/quotations/calculate", "POST", {
      items: [
        {
          glassType: "TOUGHENED_TEMPERED",
          thicknessMm: 12,
          widthMm: 2000,
          heightMm: 1000,
          quantity: 2,
          edgeWork: "FLAT_POLISH",
          holesCount: 4
        }
      ],
      taxPercent: 18,
      discountAmount: 50
    });
    if (calc.status !== 200 || !calc.data.success) {
      throw new Error(`Quotation calculate failed: ${JSON.stringify(calc)}`);
    }

    const createQuote = await request(server, "/api/quotations", "POST", {
      customerId: newCust.data.data.id,
      items: [
        {
          glassType: "TOUGHENED_TEMPERED",
          thicknessMm: 12,
          widthMm: 2000,
          heightMm: 1000,
          quantity: 2,
          edgeWork: "FLAT_POLISH",
          holesCount: 4
        }
      ],
      taxPercent: 18,
      discountAmount: 50,
      notes: "Commercial glass wall quotation"
    });
    if (createQuote.status !== 201 || !createQuote.data.success) {
      throw new Error(`Quotation create failed: ${JSON.stringify(createQuote)}`);
    }
    console.log("   ✅ Quotation calculation and creation endpoints OK!");

    // 6. Purchases
    console.log("6. GET /api/purchases & POST /api/purchases");
    const purchases = await request(server, "/api/purchases");
    if (purchases.status !== 200 || !purchases.data.success) {
      throw new Error(`Purchases get failed: ${JSON.stringify(purchases)}`);
    }

    const suppliers = await request(server, "/api/suppliers");
    const firstSupplier = suppliers.data.data[0];

    const createPO = await request(server, "/api/purchases", "POST", {
      supplierId: firstSupplier.id,
      notes: "Raw Float Batch Restock",
      items: [
        {
          itemId: firstItem.id,
          quantity: 10,
          unitCost: firstItem.unitCost
        }
      ]
    });
    if (createPO.status !== 201 || !createPO.data.success) {
      throw new Error(`Purchase order create failed: ${JSON.stringify(createPO)}`);
    }
    console.log("   ✅ Purchases endpoints OK!");

    console.log("\n✨ ALL REST API ENDPOINTS VERIFIED AND RESPONDING FLAWLESSLY! ✨\n");
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runApiTests().catch((err) => {
    console.error("❌ API Test failed:", err);
    process.exit(1);
  });
}

module.exports = { runApiTests };
