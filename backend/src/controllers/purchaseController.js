// Purchase Order Controller
const { db } = require("../config/db");
const { recordPurchaseReceipt } = require("../services/inventoryService");

// Formats purchase order with top-level supplierName and items with itemName
function formatPurchaseOrder(po) {
  if (!po) return po;
  return {
    ...po,
    supplierName: po.supplierName || po.supplier?.name || po.supplier?.contactPerson || "General Supplier",
    items: Array.isArray(po.items)
      ? po.items.map((it) => ({
          ...it,
          itemName: it.itemName || it.item?.name || "Inventory Material",
          unitOfMeasure: it.unitOfMeasure || it.item?.unitOfMeasure || "units"
        }))
      : []
  };
}

async function getPurchases(req, res, next) {
  try {
    const { supplierId, status, from, to } = req.query;
    let where = {};

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (status) {
      where.status = status;
    }

    if (from || to) {
      where.purchaseDate = {};
      if (from) where.purchaseDate.gte = new Date(from);
      if (to) where.purchaseDate.lte = new Date(to);
    }

    const purchases = await db.purchaseOrder.findMany({
      where,
      orderBy: { purchaseDate: "desc" },
      include: {
        supplier: true,
        items: {
          include: { item: true }
        }
      }
    });

    const formatted = purchases.map(formatPurchaseOrder);

    res.json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
}

async function getPurchaseById(req, res, next) {
  try {
    const { id } = req.params;
    const purchase = await db.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: { item: true }
        }
      }
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found"
      });
    }

    res.json({
      success: true,
      data: formatPurchaseOrder(purchase)
    });
  } catch (error) {
    next(error);
  }
}

async function createPurchase(req, res, next) {
  try {
    const {
      orderNumber,
      supplierId,
      supplierData, // Optional inline supplier info if supplierId not provided
      items = [],
      totalAmount,
      notes,
      purchaseDate,
      status = "COMPLETED"
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one purchase item is required."
      });
    }

    let finalSupplierId = supplierId;

    // Inline supplier creation if supplierData provided without supplierId
    if (!finalSupplierId && supplierData && supplierData.name) {
      const newSupplier = await db.supplier.create({
        data: {
          name: supplierData.name,
          contactPerson: supplierData.contactPerson || null,
          email: supplierData.email || null,
          phone: supplierData.phone || "N/A",
          taxId: supplierData.taxId || null,
          address: supplierData.address || null
        }
      });
      finalSupplierId = newSupplier.id;
    }

    if (!finalSupplierId) {
      return res.status(400).json({
        success: false,
        message: "Supplier ID or supplier details are required."
      });
    }

    // Calculate total amount if not explicitly passed
    let computedTotal = 0;
    const parsedItems = items.map((it) => {
      const qty = Number(it.quantity) || 1;
      const unitCost = Number(it.unitCost) || 0;
      const totalCost = Number(it.totalCost) || qty * unitCost;
      computedTotal += totalCost;
      return {
        itemId: it.itemId,
        quantity: qty,
        unitCost,
        totalCost
      };
    });

    const finalTotal =
      totalAmount !== undefined && totalAmount !== null && Number(totalAmount) > 0
        ? Number(totalAmount)
        : Number(computedTotal.toFixed(2));

    const finalOrderNumber =
      orderNumber || `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const purchaseOrder = await db.purchaseOrder.create({
      data: {
        orderNumber: finalOrderNumber,
        supplierId: finalSupplierId,
        totalAmount: finalTotal,
        status,
        notes: notes || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        items: {
          create: parsedItems
        }
      },
      include: {
        supplier: true,
        items: {
          include: { item: true }
        }
      }
    });

    // If order is completed, update inventory stock and record StockMovement
    if (status === "COMPLETED") {
      await recordPurchaseReceipt(purchaseOrder, parsedItems);
    }

    res.status(201).json({
      success: true,
      message: "Purchase order created and stock recorded successfully",
      data: formatPurchaseOrder(purchaseOrder)
    });
  } catch (error) {
    next(error);
  }
}

async function updatePurchaseStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required."
      });
    }

    const currentOrder = await db.purchaseOrder.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!currentOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found"
      });
    }

    const updated = await db.purchaseOrder.update({
      where: { id },
      data: { status },
      include: {
        supplier: true,
        items: {
          include: { item: true }
        }
      }
    });

    // If transitioning to COMPLETED from another status, receive stock
    if (status === "COMPLETED" && currentOrder.status !== "COMPLETED") {
      await recordPurchaseReceipt(updated, currentOrder.items);
    }

    res.json({
      success: true,
      message: `Purchase order status updated to ${status}`,
      data: formatPurchaseOrder(updated)
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchaseStatus
};
