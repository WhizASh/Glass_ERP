// Inventory Management Service
// Handles stock deductions, additions, audit logging, and movement records
const { db } = require("../config/db");

/**
 * Records physical stock addition when a Purchase Order is received
 */
async function recordPurchaseReceipt(purchaseOrder, items = []) {
  const movements = [];

  for (const item of items) {
    if (!item.itemId) continue;

    const qty = Number(item.quantity) || 0;
    if (qty <= 0) continue;

    // Update stock quantity in InventoryItem
    await db.inventoryItem.update({
      where: { id: item.itemId },
      data: {
        stockQuantity: { increment: qty }
      }
    });

    // Create StockMovement record
    const movement = await db.stockMovement.create({
      data: {
        itemId: item.itemId,
        quantity: qty,
        reason: "PURCHASE_RECEIPT",
        referenceId: purchaseOrder.id,
        notes: `Received via PO #${purchaseOrder.orderNumber}`
      }
    });

    movements.push(movement);
  }

  return movements;
}

/**
 * Fulfills stock deduction when a Quotation reaches COMPLETED status
 */
async function fulfillQuotationStock(quotation, items = []) {
  const movements = [];

  for (const item of items) {
    if (!item.itemId) continue;

    const qty = Number(item.quantity) || 0;
    if (qty <= 0) continue;

    // Deduct stock quantity in InventoryItem
    await db.inventoryItem.update({
      where: { id: item.itemId },
      data: {
        stockQuantity: { decrement: qty }
      }
    });

    // Create negative StockMovement record
    const movement = await db.stockMovement.create({
      data: {
        itemId: item.itemId,
        quantity: -qty,
        reason: "QUOTATION_FULFILLMENT",
        referenceId: quotation.id,
        notes: `Fulfilled for Quotation #${quotation.quotationNumber}`
      }
    });

    movements.push(movement);
  }

  return movements;
}

/**
 * Manually adjusts stock (e.g. for scrap breakage or physical inventory count discrepancy)
 */
async function adjustStock(itemId, quantityDelta, reason = "MANUAL_ADJUSTMENT", notes = "") {
  const item = await db.inventoryItem.findUnique({
    where: { id: itemId }
  });

  if (!item) {
    throw new Error(`Inventory item with ID ${itemId} not found`);
  }

  const delta = Number(quantityDelta);
  if (isNaN(delta) || delta === 0) {
    throw new Error("Quantity delta must be a non-zero number");
  }

  // Update item stock
  const updatedItem = await db.inventoryItem.update({
    where: { id: itemId },
    data: {
      stockQuantity: { increment: delta }
    }
  });

  // Record movement
  const movement = await db.stockMovement.create({
    data: {
      itemId,
      quantity: delta,
      reason,
      notes: notes || `Stock adjustment: ${delta > 0 ? "+" : ""}${delta} units`
    }
  });

  return {
    item: updatedItem,
    movement
  };
}

/**
 * Retrieves items that are currently at or below their reorder threshold
 */
async function getLowStockItems() {
  const allItems = await db.inventoryItem.findMany();
  return allItems.filter((item) => item.stockQuantity <= item.reorderLevel);
}

module.exports = {
  recordPurchaseReceipt,
  fulfillQuotationStock,
  adjustStock,
  getLowStockItems
};
