/**
 * Glass & Glazing Dimension, Sqft Rounding & Commercial Pricing Utilities
 *
 * Authoritative backend calculations implementing industry-standard commercial glass billing grid:
 * - Dimensions in inches rounded up to the nearest multiple of 6 inches (minimum 6")
 * - Square footage computed from rounded dimensions (W_in * H_in / 144)
 * - Commercial discounts (% or fixed) applied before tax
 * - GST / tax computed on taxable subtotal
 */

/**
 * Rounds a dimension in inches up to the nearest multiple of 6 inches (minimum 6").
 * @param {number|string} inches
 * @returns {number} Rounded dimension in inches (e.g., 57 -> 60, 44 -> 48, 76.5 -> 78)
 */
const roundDimensionTo6Inches = (inches) => {
  const val = parseFloat(inches);
  if (isNaN(val) || val <= 0) return 0;
  return Math.max(6, Math.ceil(val / 6) * 6);
};

/**
 * Calculates square footage for a piece of glass using rounded 6-inch dimensions.
 * Formula: (roundedWidthIn * roundedHeightIn) / 144
 * @param {number|string} widthInches
 * @param {number|string} heightInches
 * @returns {number} Sqft rounded to 2 decimal places
 */
const calculateItemSqft = (widthInches, heightInches) => {
  const w = roundDimensionTo6Inches(widthInches);
  const h = roundDimensionTo6Inches(heightInches);
  if (w <= 0 || h <= 0) return 0;
  return Number(((w * h) / 144).toFixed(2));
};

/**
 * Generates the commercial billing size text representation (e.g. 60" × 48").
 * @param {number|string} widthInches
 * @param {number|string} heightInches
 * @returns {string} Formatted billing size string
 */
const formatBillingSize = (widthInches, heightInches) => {
  const w = roundDimensionTo6Inches(widthInches);
  const h = roundDimensionTo6Inches(heightInches);
  if (w <= 0 || h <= 0) return '—';
  return `${w}" × ${h}"`;
};

/**
 * Calculates discount amount given fabrication subtotal, discount type, and discount value.
 * @param {number} subtotal
 * @param {string} discountType 'PERCENTAGE' | 'FIXED' | '%' | '₹'
 * @param {number|string} discountValue
 * @returns {number} Discount amount
 */
const calculateDiscount = (subtotal, discountType = 'PERCENTAGE', discountValue = 0) => {
  const sub = Math.max(0, parseFloat(subtotal) || 0);
  const val = Math.max(0, parseFloat(discountValue) || 0);
  const isPercentage = (discountType || '').toUpperCase() === 'PERCENTAGE' || discountType === '%';

  if (isPercentage) {
    const clampedPct = Math.min(100, Math.max(0, val));
    return Number(((sub * clampedPct) / 100).toFixed(2));
  }
  return Number(Math.min(sub, val).toFixed(2));
};

/**
 * Calculates square meters from millimeters or sqft.
 * @param {number|string} widthMm
 * @param {number|string} heightMm
 * @param {number|string} areaSqFt
 * @returns {number|null}
 */
const calculateItemAreaSqM = (widthMm, heightMm, areaSqFt) => {
  if (areaSqFt) {
    return Number((parseFloat(areaSqFt) * 0.092903).toFixed(4));
  }
  const w = parseFloat(widthMm);
  const h = parseFloat(heightMm);
  if (w > 0 && h > 0) {
    return Number(((w * h) / 1000000).toFixed(4));
  }
  return null;
};

/**
 * Computes full financial totals for a quotation.
 * @param {Object} params
 * @param {number} params.subtotal
 * @param {string} params.discountType
 * @param {number} params.discountValue
 * @param {number} params.taxRate
 * @returns {Object} { subtotal, discountAmount, taxableSubtotal, taxAmount, totalAmount }
 */
const calculateQuotationTotals = ({ subtotal = 0, discountType = 'PERCENTAGE', discountValue = 0, taxRate = 0 }) => {
  const sub = Math.max(0, parseFloat(subtotal) || 0);
  const discountAmount = calculateDiscount(sub, discountType, discountValue);
  const taxableSubtotal = Math.max(0, Number((sub - discountAmount).toFixed(2)));
  const tRate = Math.max(0, parseFloat(taxRate) || 0);
  const taxAmount = Number(((taxableSubtotal * tRate) / 100).toFixed(2));
  const totalAmount = Number((taxableSubtotal + taxAmount).toFixed(2));

  return {
    subtotal: Number(sub.toFixed(2)),
    discountType: (discountType || '').toUpperCase() === 'FIXED' || discountType === '₹' ? 'FIXED' : 'PERCENTAGE',
    discountValue: Math.max(0, parseFloat(discountValue) || 0),
    discountAmount,
    taxRate: tRate,
    taxAmount,
    totalAmount
  };
};

module.exports = {
  roundDimensionTo6Inches,
  calculateItemSqft,
  formatBillingSize,
  calculateDiscount,
  calculateItemAreaSqM,
  calculateQuotationTotals
};
