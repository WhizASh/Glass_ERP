const {
  roundDimensionTo6Inches,
  calculateItemSqft,
  calculateItemAreaSqM,
  calculateQuotationTotals
} = require('./glassCalculations.service');

/**
 * Generates the next sequential quotation number starting from 3 digits (e.g. 201, 202, 203),
 * automatically extending to 4 digits after 999. Purely queries PostgreSQL via Prisma.
 * @param {import('@prisma/client').PrismaClient} prisma
 * @returns {Promise<string>}
 */
const generateNextQuoteNumber = async (prisma) => {
  const quotes = await prisma.quotation.findMany({
    select: { quoteNumber: true }
  });

  const existingNumbers = new Set(
    quotes.map((q) => (q.quoteNumber ? String(q.quoteNumber).trim() : ''))
  );

  let maxNum = 200;
  for (const qn of existingNumbers) {
    if (/^\d+$/.test(qn)) {
      const val = parseInt(qn, 10);
      if (val >= 100 && val > maxNum) {
        maxNum = val;
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidate = nextNum < 100 ? String(nextNum).padStart(3, '0') : String(nextNum);

  while (existingNumbers.has(candidate)) {
    nextNum += 1;
    candidate = nextNum < 100 ? String(nextNum).padStart(3, '0') : String(nextNum);
  }

  return candidate;
};

/**
 * Validates and formats sections & line items for Prisma creation / updates.
 * Computes individual item dimensions, sqft, and item totals.
 * @param {Array} sections
 * @returns {{ formattedSections: Array, subtotal: number }}
 */
const formatSectionsForPrisma = (sections = []) => {
  let subtotal = 0;

  const formattedSections = sections.map((sec, secIdx) => {
    const rawItems = Array.isArray(sec.items) ? sec.items : (sec.items?.create || []);

    const items = rawItems.map((item) => {
      const qty = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.unitPrice) || 0;

      const widthInches = item.widthInches !== undefined && item.widthInches !== null && item.widthInches !== ''
        ? parseFloat(item.widthInches)
        : null;
      const heightInches = item.heightInches !== undefined && item.heightInches !== null && item.heightInches !== ''
        ? parseFloat(item.heightInches)
        : null;

      const roundedW = widthInches ? roundDimensionTo6Inches(widthInches) : null;
      const roundedH = heightInches ? roundDimensionTo6Inches(heightInches) : null;

      let sqft = (widthInches && heightInches)
        ? calculateItemSqft(widthInches, heightInches)
        : (item.areaSqFt ? parseFloat(item.areaSqFt) : null);

      const widthMm = item.widthMm ? parseFloat(item.widthMm) : null;
      const heightMm = item.heightMm ? parseFloat(item.heightMm) : null;

      let areaSqM = item.areaSqM ? parseFloat(item.areaSqM) : null;
      if (!areaSqM) {
        areaSqM = calculateItemAreaSqM(widthMm, heightMm, sqft);
      }
      if (!sqft && areaSqM) {
        sqft = parseFloat((areaSqM / 0.092903).toFixed(2));
      }

      const total = item.totalPrice !== undefined && item.totalPrice !== null
        ? parseFloat(item.totalPrice)
        : (sqft ? parseFloat((qty * sqft * price).toFixed(2)) : (areaSqM ? parseFloat((qty * areaSqM * price).toFixed(2)) : parseFloat((qty * price).toFixed(2))));

      subtotal += total;

      return {
        productSkuId: item.productSkuId,
        description: item.description || null,
        widthMm,
        heightMm,
        widthInches,
        heightInches,
        roundedWidthInches: roundedW,
        roundedHeightInches: roundedH,
        quantity: qty,
        areaSqM,
        areaSqFt: sqft,
        unitPrice: price,
        totalPrice: total
      };
    });

    return {
      sectionName: sec.sectionName || `Section ${secIdx + 1}`,
      sortOrder: sec.sortOrder !== undefined ? parseInt(sec.sortOrder, 10) : secIdx,
      items: {
        create: items
      }
    };
  });

  return {
    formattedSections,
    subtotal: Number(subtotal.toFixed(2))
  };
};

/**
 * Normalizes a Quotation entity from Prisma, converting Decimal types to primitive Numbers.
 * @param {Object} quote
 * @returns {Object}
 */
const normalizeQuotation = (quote) => {
  if (!quote) return null;

  return {
    ...quote,
    subtotal: Number(quote.subtotal) || 0,
    discountValue: Number(quote.discountValue) || 0,
    discountAmount: Number(quote.discountAmount) || 0,
    taxRate: Number(quote.taxRate) || 0,
    taxAmount: Number(quote.taxAmount) || 0,
    totalAmount: Number(quote.totalAmount) || 0,
    sections: (quote.sections || []).map((sec) => ({
      ...sec,
      items: (sec.items || []).map((item) => ({
        ...item,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        totalPrice: Number(item.totalPrice) || 0,
        areaSqFt: item.areaSqFt !== null && item.areaSqFt !== undefined ? Number(item.areaSqFt) : null,
        areaSqM: item.areaSqM !== null && item.areaSqM !== undefined ? Number(item.areaSqM) : null,
        widthMm: item.widthMm !== null && item.widthMm !== undefined ? Number(item.widthMm) : null,
        heightMm: item.heightMm !== null && item.heightMm !== undefined ? Number(item.heightMm) : null,
        widthInches: item.widthInches !== null && item.widthInches !== undefined ? Number(item.widthInches) : null,
        heightInches: item.heightInches !== null && item.heightInches !== undefined ? Number(item.heightInches) : null,
        roundedWidthInches: item.roundedWidthInches !== null && item.roundedWidthInches !== undefined ? Number(item.roundedWidthInches) : null,
        roundedHeightInches: item.roundedHeightInches !== null && item.roundedHeightInches !== undefined ? Number(item.roundedHeightInches) : null
      }))
    }))
  };
};

module.exports = {
  generateNextQuoteNumber,
  formatSectionsForPrisma,
  calculateQuotationTotals,
  normalizeQuotation
};
