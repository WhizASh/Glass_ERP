// Glass Calculation Engine for Area, Weight, Edge Work, Holes, and Pricing Formulas

// Edge work pricing rates per linear meter (INR / meter)
const EDGE_WORK_RATES = {
  CLEAN_CUT: 0,
  SEAMED_ARRIS: 15.0,
  FLAT_POLISH: 35.0,
  PENCIL_POLISH: 45.0,
  BEVELED: 85.0
};

// Base glass rates per square meter multiplier per mm of thickness
const BASE_GLASS_RATES_PER_MM = {
  ANNEALED_FLOAT: 120.0,
  TOUGHENED_TEMPERED: 180.0,
  LAMINATED: 240.0,
  INSULATED_DOUBLE_GLAZED: 300.0,
  FROSTED_ACID_ETCHED: 200.0,
  TINTED: 160.0,
  MIRROR: 170.0,
  LOW_E: 260.0
};

/**
 * Calculates surface area in square meters from dimensions in mm
 * Area (m^2) = (width * height) / 1,000,000
 */
function calculateAreaSqM(widthMm, heightMm) {
  if (!widthMm || !heightMm || widthMm <= 0 || heightMm <= 0) return 0;
  const area = (Number(widthMm) * Number(heightMm)) / 1_000_000;
  return Number(area.toFixed(4));
}

/**
 * Calculates perimeter in meters from dimensions in mm
 * Perimeter (m) = 2 * (width + height) / 1,000
 */
function calculatePerimeterM(widthMm, heightMm) {
  if (!widthMm || !heightMm || widthMm <= 0 || heightMm <= 0) return 0;
  const perimeter = (2 * (Number(widthMm) + Number(heightMm))) / 1_000;
  return Number(perimeter.toFixed(4));
}

/**
 * Estimates weight in kilograms based on glass standard density:
 * 2.5 kg per square meter per mm of thickness
 */
function calculateWeightKg(areaSqM, thicknessMm) {
  if (!areaSqM || !thicknessMm || areaSqM <= 0 || thicknessMm <= 0) return 0;
  const weight = Number(areaSqM) * Number(thicknessMm) * 2.5;
  return Number(weight.toFixed(2));
}

/**
 * Returns the edge finishing rate per linear meter
 */
function getEdgeWorkRate(edgeWorkType) {
  const type = String(edgeWorkType || "CLEAN_CUT").toUpperCase();
  return EDGE_WORK_RATES[type] !== undefined ? EDGE_WORK_RATES[type] : EDGE_WORK_RATES.CLEAN_CUT;
}

/**
 * Returns drilling rate per hole based on glass thickness
 */
function getHoleDrillingRate(thicknessMm) {
  const thickness = Number(thicknessMm) || 4;
  const base = 50.0;
  const heavyAdjustment = Math.max(0, thickness - 6) * 5.0;
  return base + heavyAdjustment;
}

/**
 * Returns the base rate per square meter for a glass type and thickness
 */
function getBaseGlassRate(glassType, thicknessMm) {
  const type = String(glassType || "ANNEALED_FLOAT").toUpperCase();
  const thickness = Number(thicknessMm) || 4;
  const multiplier = BASE_GLASS_RATES_PER_MM[type] || BASE_GLASS_RATES_PER_MM.ANNEALED_FLOAT;
  return multiplier * thickness;
}

/**
 * Computes all pricing metrics for a single glass line item:
 * Area, perimeter, weight, base cost, edge cost, hole cost, unit price, and total line cost.
 */
function calculateItemPricing({
  widthMm,
  heightMm,
  thicknessMm,
  glassType,
  edgeWork = "CLEAN_CUT",
  holesCount = 0,
  quantity = 1,
  customUnitPrice = null
}) {
  const areaSqM = calculateAreaSqM(widthMm, heightMm);
  const perimeterM = calculatePerimeterM(widthMm, heightMm);
  const weightKg = calculateWeightKg(areaSqM, thicknessMm);

  const baseRate = getBaseGlassRate(glassType, thicknessMm);
  const edgeRate = getEdgeWorkRate(edgeWork);
  const holeRate = getHoleDrillingRate(thicknessMm);

  const baseGlassCost = areaSqM * baseRate;
  const edgeCost = perimeterM * edgeRate;
  const holesCost = Math.max(0, Number(holesCount) || 0) * holeRate;

  // If a manual unit price was passed in and is > 0, use it; otherwise compute standard rate
  const computedUnitPrice = baseGlassCost + edgeCost + holesCost;
  const finalUnitPrice =
    customUnitPrice !== null && customUnitPrice !== undefined && Number(customUnitPrice) > 0
      ? Number(customUnitPrice)
      : Number(computedUnitPrice.toFixed(2));

  const validQty = Math.max(1, parseInt(quantity, 10) || 1);
  const lineTotal = Number((finalUnitPrice * validQty).toFixed(2));

  return {
    areaSqM,
    perimeterM,
    weightKg,
    baseRate,
    baseGlassCost: Number(baseGlassCost.toFixed(2)),
    edgeRate,
    edgeCost: Number(edgeCost.toFixed(2)),
    holeRate,
    holesCost: Number(holesCost.toFixed(2)),
    unitPrice: finalUnitPrice,
    quantity: validQty,
    lineTotal
  };
}

/**
 * Computes quotation summary totals from an array of items:
 * Subtotal, discount, taxable amount, tax amount (default 18% GST), and grand total.
 */
function calculateQuotationTotals(items = [], discountAmount = 0, taxPercent = 18.0) {
  const subtotal = items.reduce((acc, item) => acc + (Number(item.lineTotal) || 0), 0);
  const discount = Math.max(0, Number(discountAmount) || 0);
  const taxableAmount = Math.max(0, subtotal - discount);
  const taxRate = Number(taxPercent) || 0;
  const taxAmount = Number(((taxableAmount * taxRate) / 100).toFixed(2));
  const totalAmount = Number((taxableAmount + taxAmount).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount: Number(discount.toFixed(2)),
    taxableAmount: Number(taxableAmount.toFixed(2)),
    taxPercent: taxRate,
    taxAmount,
    totalAmount
  };
}

module.exports = {
  EDGE_WORK_RATES,
  BASE_GLASS_RATES_PER_MM,
  calculateAreaSqM,
  calculatePerimeterM,
  calculateWeightKg,
  getEdgeWorkRate,
  getHoleDrillingRate,
  getBaseGlassRate,
  calculateItemPricing,
  calculateQuotationTotals
};
