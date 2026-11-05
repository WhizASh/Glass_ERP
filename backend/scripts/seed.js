// Database Seed Script for Glass Production Facility ERP
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const { PrismaClient } = require("@prisma/client");
const {
  initialCustomers,
  initialSuppliers,
  initialInventory,
  initialPurchaseOrders,
  initialQuotations,
  initialStockMovements
} = require("../src/config/initialData");

const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Starting Glass Production Facility ERP Database Seed...");

  try {
    // Probe connection
    await prisma.$connect();
    console.log("✅ Connected to PostgreSQL database successfully.");

    console.log("🧹 Cleaning existing data...");
    await prisma.stockMovement.deleteMany({});
    await prisma.quotationItem.deleteMany({});
    await prisma.quotation.deleteMany({});
    await prisma.purchaseOrderItem.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});
    await prisma.inventoryItem.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.supplier.deleteMany({});

    console.log("📦 Seeding Suppliers...");
    for (const supplier of initialSuppliers) {
      await prisma.supplier.create({ data: supplier });
    }

    console.log("👥 Seeding Customers (Individual & Organization)...");
    for (const customer of initialCustomers) {
      await prisma.customer.create({ data: customer });
    }

    console.log("🏭 Seeding Inventory Items (Float Sheets, Finished Glass, Raw Materials, Hardware)...");
    for (const item of initialInventory) {
      await prisma.inventoryItem.create({ data: item });
    }

    console.log("🛒 Seeding Purchase Orders & Items...");
    for (const po of initialPurchaseOrders) {
      const { items, ...poData } = po;
      const sanitizedItems = (items || []).map(({ purchaseOrderId, ...rest }) => rest);
      await prisma.purchaseOrder.create({
        data: {
          ...poData,
          items: {
            create: sanitizedItems
          }
        }
      });
    }

    console.log("📋 Seeding Quotations & Line Items...");
    for (const quote of initialQuotations) {
      const { items, ...quoteData } = quote;
      const sanitizedItems = (items || []).map(({ quotationId, ...rest }) => rest);
      await prisma.quotation.create({
        data: {
          ...quoteData,
          items: {
            create: sanitizedItems
          }
        }
      });
    }

    console.log("📊 Seeding Stock Movements & Breakage Logs...");
    for (const movement of initialStockMovements) {
      await prisma.stockMovement.create({ data: movement });
    }

    console.log("✨ DATABASE SEEDING COMPLETED SUCCESSFULLY! ✨");
    console.log(`   - Suppliers: ${initialSuppliers.length}`);
    console.log(`   - Customers: ${initialCustomers.length}`);
    console.log(`   - Inventory Items: ${initialInventory.length}`);
    console.log(`   - Purchase Orders: ${initialPurchaseOrders.length}`);
    console.log(`   - Quotations: ${initialQuotations.length}`);
    console.log(`   - Stock Movements: ${initialStockMovements.length}`);
  } catch (error) {
    console.error("❌ Error during database seeding:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
