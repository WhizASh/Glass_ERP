// Dashboard Analytics Service
// Aggregates KPIs, sales timeseries, top produced materials, and recent activities
const { db } = require("../config/db");
const { getLowStockItems } = require("./inventoryService");

/**
 * Returns overall executive KPIs for the Glass Facility Dashboard
 */
async function getSummary() {
  const [quotations, purchaseOrders, inventoryItems, customers, suppliers] = await Promise.all([
    db.quotation.findMany(),
    db.purchaseOrder.findMany(),
    db.inventoryItem.findMany(),
    db.customer.findMany(),
    db.supplier.findMany()
  ]);

  // Total revenue from confirmed or completed quotations
  const totalRevenue = quotations
    .filter((q) => q.status === "COMPLETED" || q.status === "CONFIRMED")
    .reduce((sum, q) => sum + (Number(q.totalAmount) || 0), 0);

  // Active quotations count (Draft, Issued, Confirmed)
  const activeQuotationsCount = quotations.filter(
    (q) => q.status === "DRAFT" || q.status === "ISSUED" || q.status === "CONFIRMED"
  ).length;

  // Total completed sales count
  const completedSalesCount = quotations.filter((q) => q.status === "COMPLETED").length;

  // Recent purchases total spend
  const totalPurchasesSpend = purchaseOrders.reduce(
    (sum, po) => sum + (Number(po.totalAmount) || 0),
    0
  );

  // Low stock items count
  const lowStockCount = inventoryItems.filter(
    (item) => Number(item.stockQuantity) <= Number(item.reorderLevel)
  ).length;

  const kpis = {
    totalRevenue: Number(totalRevenue.toFixed(2)),
    activeQuotationsCount,
    completedSalesCount,
    totalPurchasesSpend: Number(totalPurchasesSpend.toFixed(2)),
    lowStockCount,
    totalCustomers: customers.length,
    totalSuppliers: suppliers.length,
    totalInventoryItems: inventoryItems.length
  };

  return {
    ...kpis,
    kpis
  };
}

/**
 * Aggregates quotation sales data into timeseries for charts (by day, week, or month)
 */
async function getSalesChart(period = "month") {
  const quotations = await db.quotation.findMany({
    orderBy: { createdAt: "asc" }
  });

  const buckets = {};

  for (const quote of quotations) {
    if (quote.status === "CANCELLED") continue;

    const date = new Date(quote.createdAt);
    let key;

    if (period === "week") {
      // Format as Day name or YYYY-MM-DD
      key = date.toISOString().slice(0, 10);
    } else if (period === "year") {
      // Format as YYYY-MM
      key = date.toISOString().slice(0, 7);
    } else {
      // Default: Last 30 days grouped by date
      key = date.toISOString().slice(0, 10);
    }

    if (!buckets[key]) {
      buckets[key] = {
        date: key,
        revenue: 0,
        quotationsCount: 0,
        confirmedRevenue: 0
      };
    }

    buckets[key].revenue += Number(quote.totalAmount) || 0;
    buckets[key].quotationsCount += 1;
    if (quote.status === "COMPLETED" || quote.status === "CONFIRMED") {
      buckets[key].confirmedRevenue += Number(quote.totalAmount) || 0;
    }
  }

  // Format array sorted by date
  const chartData = Object.values(buckets).map((item) => ({
    date: item.date,
    revenue: Number(item.revenue.toFixed(2)),
    confirmedRevenue: Number(item.confirmedRevenue.toFixed(2)),
    quotationsCount: item.quotationsCount
  }));

  return chartData;
}

/**
 * Ranks top produced glass materials based on square meters (m^2) and total quantity
 */
async function getTopProducedMaterials(limit = 5) {
  const quotationItems = await db.quotationItem.findMany({
    include: { quotation: true }
  });

  // Group by glassType and thicknessMm
  const groups = {};

  for (const item of quotationItems) {
    const key = `${item.glassType}__${item.thicknessMm}mm`;
    const area = (Number(item.areaSqM) || 0) * (Number(item.quantity) || 1);
    const amount = Number(item.lineTotal) || 0;
    const qty = Number(item.quantity) || 1;

    if (!groups[key]) {
      groups[key] = {
        glassType: item.glassType,
        thicknessMm: item.thicknessMm,
        label: `${item.thicknessMm}mm ${formatGlassType(item.glassType)}`,
        totalAreaSqM: 0,
        totalQuantity: 0,
        totalRevenue: 0,
        orderCount: 0
      };
    }

    groups[key].totalAreaSqM += area;
    groups[key].totalQuantity += qty;
    groups[key].totalRevenue += amount;
    groups[key].orderCount += 1;
  }

  const ranked = Object.values(groups)
    .sort((a, b) => b.totalAreaSqM - a.totalAreaSqM)
    .slice(0, limit)
    .map((item) => ({
      ...item,
      totalAreaSqM: Number(item.totalAreaSqM.toFixed(2)),
      totalRevenue: Number(item.totalRevenue.toFixed(2))
    }));

  return ranked;
}

/**
 * Helper to format enum glass types into human readable labels
 */
function formatGlassType(type) {
  if (!type) return "Glass";
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Returns recent sales quotations and material purchases for dashboard feeds
 */
async function getRecentActivity(limit = 5) {
  const [recentSales, recentPurchases] = await Promise.all([
    db.quotation.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        items: true
      }
    }),
    db.purchaseOrder.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        supplier: true,
        items: {
          include: { item: true }
        }
      }
    })
  ]);

  const formattedSales = recentSales.map((q) => ({
    ...q,
    customerName: q.customerName || q.customer?.name || q.customer?.companyName || "Direct Client",
    customerType: q.customerType || q.customer?.type || "INDIVIDUAL"
  }));

  const formattedPurchases = recentPurchases.map((po) => ({
    ...po,
    supplierName: po.supplierName || po.supplier?.name || po.supplier?.contactPerson || "General Supplier",
    items: Array.isArray(po.items)
      ? po.items.map((it) => ({
          ...it,
          itemName: it.itemName || it.item?.name || "Inventory Material",
          unitOfMeasure: it.unitOfMeasure || it.item?.unitOfMeasure || "units"
        }))
      : []
  }));

  return {
    recentSales: formattedSales,
    recentQuotations: formattedSales,
    recentPurchases: formattedPurchases
  };
}

module.exports = {
  getSummary,
  getSalesChart,
  getTopProducedMaterials,
  getRecentActivity
};
