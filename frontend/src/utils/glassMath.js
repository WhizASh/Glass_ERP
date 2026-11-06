/**
 * Glass calculation utilities for VitroGlass ERP.
 * Standard glass density: 2500 kg/m³ (2.5 kg per m² per mm thickness)
 */

export const GLASS_TYPES = [
  { id: 'ANNEALED_FLOAT', label: 'Annealed Float Glass', baseRatePerSqm: 28 },
  { id: 'TOUGHENED_TEMPERED', label: 'Toughened / Tempered Glass', baseRatePerSqm: 48 },
  { id: 'LAMINATED', label: 'Laminated Safety Glass (PVB)', baseRatePerSqm: 68 },
  { id: 'INSULATED_DOUBLE_GLAZED', label: 'Double Glazed (DGU / IGU)', baseRatePerSqm: 98 },
  { id: 'LOW_E', label: 'Low-E Energy Saving Glass', baseRatePerSqm: 88 },
  { id: 'FROSTED_ACID_ETCHED', label: 'Frosted / Acid Etched Glass', baseRatePerSqm: 56 },
  { id: 'TINTED', label: 'Tinted / Body-Tinted Float', baseRatePerSqm: 44 },
  { id: 'MIRROR', label: 'Silvered / Float Mirror', baseRatePerSqm: 38 },
];

export const STANDARD_THICKNESSES = [4, 5, 6, 8, 10, 12, 15, 19];

export const EDGE_WORK_TYPES = [
  { id: 'CLEAN_CUT', label: 'Clean Cut (Raw)', ratePerMeter: 0 },
  { id: 'SEAMED_ARRIS', label: 'Seamed / Arris Edge', ratePerMeter: 3.5 },
  { id: 'FLAT_POLISH', label: 'Flat Ground & Polished Edge', ratePerMeter: 7.5 },
  { id: 'PENCIL_POLISH', label: 'Pencil / Round Polished Edge', ratePerMeter: 9.0 },
  { id: 'BEVELED', label: 'Beveled Edge (1-inch)', ratePerMeter: 15.0 },
];

export const HOLE_DRILL_RATE = 5.0; // ₹ per CNC drilled hole

/**
 * Calculates surface area in square meters (m²) given dimensions in millimeters (mm).
 */
export function calculateAreaSqm(widthMm, heightMm) {
  if (!widthMm || !heightMm || widthMm <= 0 || heightMm <= 0) return 0;
  return Number(((widthMm * heightMm) / 1000000).toFixed(4));
}

/**
 * Calculates perimeter in linear meters (m) given dimensions in millimeters (mm).
 */
export function calculatePerimeterM(widthMm, heightMm) {
  if (!widthMm || !heightMm || widthMm <= 0 || heightMm <= 0) return 0;
  return Number(((2 * (Number(widthMm) + Number(heightMm))) / 1000).toFixed(3));
}

/**
 * Calculates theoretical glass weight in kilograms (kg).
 * Weight = Area (m²) * Thickness (mm) * 2.5 kg/m²/mm
 */
export function calculateGlassWeightKg(areaSqm, thicknessMm) {
  if (!areaSqm || !thicknessMm || areaSqm <= 0 || thicknessMm <= 0) return 0;
  return Number((areaSqm * thicknessMm * 2.5).toFixed(2));
}

/**
 * Multiplier based on thickness compared to standard 4mm baseline
 */
export function getThicknessMultiplier(thicknessMm) {
  const t = Number(thicknessMm) || 4;
  if (t <= 4) return 1.0;
  if (t <= 6) return 1.25;
  if (t <= 8) return 1.55;
  if (t <= 10) return 1.95;
  if (t <= 12) return 2.45;
  if (t <= 15) return 3.20;
  return 4.10; // 19mm+
}

/**
 * Calculates price for a single glass specification line item.
 */
export function calculateLineItemPrice({
  widthMm,
  heightMm,
  thicknessMm = 6,
  glassType = 'ANNEALED_FLOAT',
  edgeWork = 'CLEAN_CUT',
  holesCount = 0,
  quantity = 1,
}) {
  const areaSqm = calculateAreaSqm(widthMm, heightMm);
  const perimeterM = calculatePerimeterM(widthMm, heightMm);
  const weightKg = calculateGlassWeightKg(areaSqm, thicknessMm);

  const glassTypeObj = GLASS_TYPES.find((g) => g.id === glassType) || GLASS_TYPES[0];
  const edgeWorkObj = EDGE_WORK_TYPES.find((e) => e.id === edgeWork) || EDGE_WORK_TYPES[0];

  const thicknessMultiplier = getThicknessMultiplier(thicknessMm);
  const baseRate = glassTypeObj.baseRatePerSqm * thicknessMultiplier;

  const glassCost = areaSqm * baseRate;
  const edgeCost = perimeterM * edgeWorkObj.ratePerMeter;
  const holesCost = Math.max(0, Number(holesCount) || 0) * HOLE_DRILL_RATE;

  const unitPrice = Number((glassCost + edgeCost + holesCost).toFixed(2));
  const qty = Math.max(1, Number(quantity) || 1);
  const lineTotal = Number((unitPrice * qty).toFixed(2));

  return {
    areaSqm,
    perimeterM,
    weightKg,
    unitPrice,
    lineTotal,
    quantity: qty,
    breakdown: {
      glassCost: Number(glassCost.toFixed(2)),
      edgeCost: Number(edgeCost.toFixed(2)),
      holesCost: Number(holesCost.toFixed(2)),
    },
  };
}
