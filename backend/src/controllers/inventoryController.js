// Inventory Controller
const { db } = require("../config/db");
const { adjustStock } = require("../services/inventoryService");

async function getInventory(req, res, next) {
  try {
    const { category, glassType, lowStock, q } = req.query;
    let where = {};

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (glassType) {
      where.glassType = glassType;
    }

    if (q) {
      where.OR = [
        { sku: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { rackLocation: { contains: q, mode: "insensitive" } }
      ];
    }

    let items = await db.inventoryItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        movements: {
          take: 5,
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (lowStock === "true" || lowStock === true) {
      items = items.filter((item) => Number(item.stockQuantity) <= Number(item.reorderLevel));
    }

    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    next(error);
  }
}

async function getInventoryItemById(req, res, next) {
  try {
    const { id } = req.params;
    const item = await db.inventoryItem.findUnique({
      where: { id },
      include: {
        movements: {
          orderBy: { createdAt: "desc" },
          take: 20
        }
      }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
}

async function createInventoryItem(req, res, next) {
  try {
    const {
      sku,
      name,
      category,
      glassType,
      thicknessMm,
      widthMm,
      heightMm,
      stockQuantity = 0,
      unitOfMeasure = "Sheets",
      reorderLevel = 10,
      unitCost = 0,
      unitPrice = 0,
      rackLocation
    } = req.body;

    if (!sku || !name || !category) {
      return res.status(400).json({
        success: false,
        message: "SKU, item name, and category are required."
      });
    }

    // Check SKU uniqueness
    const existing = await db.inventoryItem.findUnique({ where: { sku } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `An item with SKU "${sku}" already exists.`
      });
    }

    const item = await db.inventoryItem.create({
      data: {
        sku: sku.trim(),
        name: name.trim(),
        category,
        glassType: glassType || null,
        thicknessMm: thicknessMm ? Number(thicknessMm) : null,
        widthMm: widthMm ? Number(widthMm) : null,
        heightMm: heightMm ? Number(heightMm) : null,
        stockQuantity: Number(stockQuantity) || 0,
        unitOfMeasure: unitOfMeasure || "Sheets",
        reorderLevel: Number(reorderLevel) || 10,
        unitCost: Number(unitCost) || 0,
        unitPrice: Number(unitPrice) || 0,
        rackLocation: rackLocation ? rackLocation.trim() : null
      }
    });

    res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      data: item
    });
  } catch (error) {
    next(error);
  }
}

async function updateInventoryItem(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await db.inventoryItem.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }

    const {
      sku,
      name,
      category,
      glassType,
      thicknessMm,
      widthMm,
      heightMm,
      stockQuantity,
      unitOfMeasure,
      reorderLevel,
      unitCost,
      unitPrice,
      rackLocation
    } = req.body;

    const updated = await db.inventoryItem.update({
      where: { id },
      data: {
        ...(sku !== undefined && { sku: sku.trim() }),
        ...(name !== undefined && { name: name.trim() }),
        ...(category !== undefined && { category }),
        ...(glassType !== undefined && { glassType }),
        ...(thicknessMm !== undefined && { thicknessMm: Number(thicknessMm) }),
        ...(widthMm !== undefined && { widthMm: Number(widthMm) }),
        ...(heightMm !== undefined && { heightMm: Number(heightMm) }),
        ...(stockQuantity !== undefined && { stockQuantity: Number(stockQuantity) }),
        ...(unitOfMeasure !== undefined && { unitOfMeasure }),
        ...(reorderLevel !== undefined && { reorderLevel: Number(reorderLevel) }),
        ...(unitCost !== undefined && { unitCost: Number(unitCost) }),
        ...(unitPrice !== undefined && { unitPrice: Number(unitPrice) }),
        ...(rackLocation !== undefined && { rackLocation: rackLocation ? rackLocation.trim() : null })
      }
    });

    res.json({
      success: true,
      message: "Inventory item updated successfully",
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

async function deleteInventoryItem(req, res, next) {
  try {
    const { id } = req.params;
    await db.inventoryItem.delete({ where: { id } });
    res.json({
      success: true,
      message: "Inventory item deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}

async function adjustStockHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { quantityDelta, quantity, reason = "MANUAL_ADJUSTMENT", notes } = req.body;
    const delta = quantityDelta !== undefined ? quantityDelta : quantity;

    if (delta === undefined || delta === null || isNaN(Number(delta))) {
      return res.status(400).json({
        success: false,
        message: "quantityDelta (or quantity) is required (e.g. -2 for breakage or +10 for audit correction)."
      });
    }

    const result = await adjustStock(id, Number(delta), reason, notes);

    res.json({
      success: true,
      message: "Stock adjusted and movement recorded successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getInventory,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustStockHandler
};
