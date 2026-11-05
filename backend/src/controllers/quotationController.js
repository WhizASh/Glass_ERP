// Quotation & Billing Controller
const { db } = require("../config/db");
const {
  calculateItemPricing,
  calculateQuotationTotals,
  calculateAreaSqM
} = require("../services/glassCalculationService");
const { fulfillQuotationStock } = require("../services/inventoryService");

async function getQuotations(req, res, next) {
  try {
    const { customerId, status, from, to } = req.query;
    let where = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const quotations = await db.quotation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        items: {
          include: { item: true }
        }
      }
    });

    res.json({
      success: true,
      count: quotations.length,
      data: quotations
    });
  } catch (error) {
    next(error);
  }
}

async function getQuotationById(req, res, next) {
  try {
    const { id } = req.params;
    const quotation = await db.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: { item: true }
        }
      }
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found"
      });
    }

    res.json({
      success: true,
      data: quotation
    });
  } catch (error) {
    next(error);
  }
}

async function createQuotation(req, res, next) {
  try {
    const {
      quotationNumber,
      customerId,
      customerData,
      items = [],
      taxPercent = 18.0,
      discountAmount = 0,
      status = "DRAFT",
      validUntil,
      notes
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one glass item is required to generate a quotation."
      });
    }

    let finalCustomerId = customerId;

    // Inline customer creation if customerData provided without customerId
    if (!finalCustomerId && customerData && customerData.name) {
      const newCustomer = await db.customer.create({
        data: {
          type: customerData.type === "ORGANIZATION" ? "ORGANIZATION" : "INDIVIDUAL",
          name: customerData.name,
          companyName: customerData.companyName || null,
          gstin: customerData.gstin || null,
          email: customerData.email || null,
          phone: customerData.phone || "N/A",
          billingAddress: customerData.billingAddress || null,
          shippingAddress: customerData.shippingAddress || null
        }
      });
      finalCustomerId = newCustomer.id;
    }

    if (!finalCustomerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID or valid customer details are required."
      });
    }

    // Process and calculate each glass line item
    const parsedItems = items.map((item) => {
      const pricing = calculateItemPricing({
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        thicknessMm: item.thicknessMm,
        glassType: item.glassType,
        edgeWork: item.edgeWork,
        holesCount: item.holesCount,
        quantity: item.quantity,
        customUnitPrice: item.unitPrice
      });

      return {
        itemId: item.itemId || null,
        glassType: item.glassType || "ANNEALED_FLOAT",
        thicknessMm: Number(item.thicknessMm) || 6,
        widthMm: Number(item.widthMm) || 1000,
        heightMm: Number(item.heightMm) || 1000,
        areaSqM: pricing.areaSqM,
        quantity: pricing.quantity,
        edgeWork: item.edgeWork || "CLEAN_CUT",
        holesCount: parseInt(item.holesCount, 10) || 0,
        unitPrice: pricing.unitPrice,
        lineTotal: pricing.lineTotal
      };
    });

    // Compute quotation totals
    const totals = calculateQuotationTotals(parsedItems, discountAmount, taxPercent);

    const finalQuotationNumber =
      quotationNumber || `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const quotation = await db.quotation.create({
      data: {
        quotationNumber: finalQuotationNumber,
        customerId: finalCustomerId,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: totals.discountAmount,
        totalAmount: totals.totalAmount,
        status,
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 86400000),
        notes: notes || null,
        items: {
          create: parsedItems
        }
      },
      include: {
        customer: true,
        items: {
          include: { item: true }
        }
      }
    });

    // If directly created in COMPLETED status, fulfill stock immediately
    if (status === "COMPLETED") {
      await fulfillQuotationStock(quotation, parsedItems);
    }

    res.status(201).json({
      success: true,
      message: "Quotation generated successfully",
      data: quotation
    });
  } catch (error) {
    next(error);
  }
}

async function updateQuotationStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required (DRAFT, ISSUED, CONFIRMED, COMPLETED, CANCELLED)."
      });
    }

    const currentQuote = await db.quotation.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!currentQuote) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found"
      });
    }

    const updated = await db.quotation.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        items: {
          include: { item: true }
        }
      }
    });

    // If transitioned to COMPLETED from another status, fulfill stock
    if (status === "COMPLETED" && currentQuote.status !== "COMPLETED") {
      await fulfillQuotationStock(updated, currentQuote.items);
    }

    res.json({
      success: true,
      message: `Quotation status updated to ${status}`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

async function previewCalculation(req, res, next) {
  try {
    const {
      widthMm,
      heightMm,
      thicknessMm,
      glassType,
      edgeWork = "CLEAN_CUT",
      holesCount = 0,
      quantity = 1,
      unitPrice
    } = req.body;

    const calculation = calculateItemPricing({
      widthMm,
      heightMm,
      thicknessMm,
      glassType,
      edgeWork,
      holesCount,
      quantity,
      customUnitPrice: unitPrice
    });

    res.json({
      success: true,
      data: calculation
    });
  } catch (error) {
    next(error);
  }
}

async function deleteQuotation(req, res, next) {
  try {
    const { id } = req.params;
    await db.quotation.delete({ where: { id } });
    res.json({
      success: true,
      message: "Quotation deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotationStatus,
  previewCalculation,
  deleteQuotation
};
