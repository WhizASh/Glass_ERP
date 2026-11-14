/**
 * Glass & Glazing Dimension, Sqft Rounding & Commercial Pricing Utilities
 *
 * Implements the industry-standard commercial glass billing grid where
 * dimensions in inches are rounded to the nearest multiple of 6 inches (commercial slab),
 * square footage is computed from the rounded dimensions (W_in * H_in / 144),
 * and commercial discounts (% or ₹) are applied before tax calculation.
 */

export const SQFT_TO_SQM = 0.092903;
export const SQM_TO_SQFT = 10.76391;

/**
 * Converts rate between SQ_FT (₹/sqft) and SQ_METER (₹/m²).
 * @param {number|string} rate
 * @param {string} fromUnit 'SQ_FT' | 'SQ_METER'
 * @param {string} toUnit 'SQ_FT' | 'SQ_METER'
 * @returns {number}
 */
export const convertRateBetweenUnits = (rate, fromUnit, toUnit) => {
  const val = parseFloat(rate);
  if (isNaN(val) || val <= 0 || fromUnit === toUnit) return Math.max(0, val || 0);

  if (fromUnit === 'SQ_FT' && toUnit === 'SQ_METER') {
    return Number((val * SQM_TO_SQFT).toFixed(2));
  }
  if (fromUnit === 'SQ_METER' && toUnit === 'SQ_FT') {
    return Number((val * SQFT_TO_SQM).toFixed(2));
  }
  return Number(val.toFixed(2));
};

/**
 * Rounds a dimension in inches up to the nearest multiple of 6 inches (minimum 6").
 * @param {number|string} inches
 * @returns {number} Rounded dimension in inches (e.g., 57 -> 60, 44 -> 48, 76.5 -> 78)
 */
export const roundDimensionTo6Inches = (inches) => {
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
export const calculateItemSqft = (widthInches, heightInches) => {
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
export const formatBillingSize = (widthInches, heightInches) => {
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
 * @returns {number} Discount amount in ₹
 */
export const calculateDiscount = (subtotal, discountType = 'PERCENTAGE', discountValue = 0) => {
  const sub = Math.max(0, parseFloat(subtotal) || 0);
  const val = Math.max(0, parseFloat(discountValue) || 0);
  const isPercentage = discountType === 'PERCENTAGE' || discountType === '%';

  if (isPercentage) {
    return Number(((sub * val) / 100).toFixed(2));
  }
  return Number(Math.min(val, sub).toFixed(2));
};

/**
 * Calculates full line item metrics including rounded dimensions, sqft, sqm, and line total.
 * @param {object} item
 * @param {string} measurementUnit 'SQ_FT' | 'SQ_METER'
 * @returns {object}
 */
export const calculateLineItemMetrics = (item, measurementUnit = 'SQ_FT') => {
  const qty = Math.max(1, parseFloat(item.quantity) || 1);
  const rate = Math.max(0, parseFloat(item.unitPrice) || 0);
  const widthIn = parseFloat(item.widthInches) || 0;
  const heightIn = parseFloat(item.heightInches) || 0;

  const roundedWidth = widthIn > 0 ? roundDimensionTo6Inches(widthIn) : 0;
  const roundedHeight = heightIn > 0 ? roundDimensionTo6Inches(heightIn) : 0;
  const sqft = (widthIn > 0 && heightIn > 0)
    ? calculateItemSqft(widthIn, heightIn)
    : (parseFloat(item.areaSqFt) || 0);

  const totalSqft = Number((sqft * qty).toFixed(2));

  const sqM = item.areaSqM && parseFloat(item.areaSqM) > 0
    ? parseFloat(item.areaSqM)
    : Number((sqft * SQFT_TO_SQM).toFixed(4));
  const totalSqM = Number((sqM * qty).toFixed(4));

  const isM2 = measurementUnit === 'SQ_METER';
  const area = isM2 ? sqM : sqft;
  const totalArea = isM2 ? totalSqM : totalSqft;

  let lineTotal = 0;
  if (isM2 && totalSqM > 0) {
    lineTotal = Number((totalSqM * rate).toFixed(2));
  } else if (sqft > 0) {
    lineTotal = Number((totalSqft * rate).toFixed(2));
  } else {
    lineTotal = Number((qty * rate).toFixed(2));
  }

  return {
    widthIn,
    heightIn,
    roundedWidth,
    roundedHeight,
    billingSizeText: formatBillingSize(widthIn, heightIn),
    sqft,
    totalSqft,
    sqM,
    totalSqM,
    area,
    totalArea,
    unitLabel: isM2 ? 'm²' : 'sqft',
    rateLabel: isM2 ? '₹/m²' : '₹/sqft',
    lineTotal
  };
};

/**
 * Calculates aggregate commercial totals for an array of sections.
 * @param {Array} sections Array of sections, each having an items array
 * @param {string} discountType 'PERCENTAGE' | 'FIXED'
 * @param {number|string} discountValue
 * @param {number|string} taxRate GST percentage (default 18)
 * @param {string} measurementUnit 'SQ_FT' | 'SQ_METER'
 * @returns {object}
 */
export const calculateQuotationTotals = (
  sections = [],
  discountType = 'PERCENTAGE',
  discountValue = 0,
  taxRate = 18,
  measurementUnit = 'SQ_FT'
) => {
  let totalSqft = 0;
  let totalSqM = 0;
  let subtotal = 0;

  (sections || []).forEach((sec) => {
    (sec.items || []).forEach((item) => {
      const metrics = calculateLineItemMetrics(item, measurementUnit);
      totalSqft += metrics.totalSqft;
      totalSqM += metrics.totalSqM;
      subtotal += metrics.lineTotal;
    });
  });

  totalSqft = Number(totalSqft.toFixed(2));
  totalSqM = Number(totalSqM.toFixed(3));
  subtotal = Number(subtotal.toFixed(2));

  const discountAmount = calculateDiscount(subtotal, discountType, discountValue);
  const taxableSubtotal = Number(Math.max(0, subtotal - discountAmount).toFixed(2));

  const rate = Math.max(0, parseFloat(taxRate) || 0);
  const taxAmount = Number(((taxableSubtotal * rate) / 100).toFixed(2));
  const grandTotal = Number((taxableSubtotal + taxAmount).toFixed(2));

  return {
    totalSqft,
    totalSqM,
    totalArea: measurementUnit === 'SQ_METER' ? totalSqM : totalSqft,
    measurementUnit,
    subtotal,
    discountType: (discountType === 'FIXED' || discountType === '₹') ? 'FIXED' : 'PERCENTAGE',
    discountValue: parseFloat(discountValue) || 0,
    discountAmount,
    taxableSubtotal,
    taxRate: rate,
    taxAmount,
    grandTotal
  };
};

/**
 * Formats a number as Indian Currency (e.g. ₹1,12,100.00).
 * @param {number|string} amount
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Formats sqft number with 2 decimals (e.g. "20.00").
 * @param {number|string} sqft
 * @returns {string}
 */
export const formatSqft = (sqft) => {
  const num = parseFloat(sqft) || 0;
  return num.toFixed(2);
};

/**
 * Formats area according to measurement unit ('SQ_FT' -> 2 decimals, 'SQ_METER' -> 3 decimals).
 * @param {number|string} area
 * @param {string} unit 'SQ_FT' | 'SQ_METER'
 * @returns {string}
 */
export const formatArea = (area, unit = 'SQ_FT') => {
  const num = parseFloat(area) || 0;
  return unit === 'SQ_METER' ? num.toFixed(3) : num.toFixed(2);
};

/**
 * Converts a currency number to Indian English words.
 * (e.g. 112100 -> "Rupees One Lakh Twelve Thousand One Hundred Only")
 * @param {number} num
 * @returns {string}
 */
export const numberToWordsIndian = (num) => {
  if (!num || isNaN(num)) return 'Rupees Zero Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.floor(Math.abs(num));
  if (n === 0) return 'Rupees Zero Only';

  const inWords = (val) => {
    let str = '';
    if (val > 9999999) {
      str += inWords(Math.floor(val / 10000000)) + 'Crore ';
      val %= 10000000;
    }
    if (val > 99999) {
      str += inWords(Math.floor(val / 100000)) + 'Lakh ';
      val %= 100000;
    }
    if (val > 999) {
      str += inWords(Math.floor(val / 1000)) + 'Thousand ';
      val %= 1000;
    }
    if (val > 99) {
      str += inWords(Math.floor(val / 100)) + 'Hundred ';
      val %= 100;
    }
    if (val > 0) {
      if (val < 20) {
        str += a[val];
      } else {
        str += b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : ' ');
      }
    }
    return str;
  };

  return `Rupees ${inWords(n).trim()} Only`;
};

/**
 * Universal display metric extractor for line items in drawer schedule and print view.
 * Handles inches, mm, pre-computed billing sizes, sqft, and sqm robustly.
 * @param {object} item Line item object
 * @param {string} measurementUnit 'SQ_FT' | 'SQ_METER'
 * @returns {object}
 */
export const getItemDisplayMetrics = (item, measurementUnit = 'SQ_FT') => {
  if (!item) {
    return {
      widthIn: null,
      heightIn: null,
      cutSize: '—',
      billingSize: '—',
      sqft: 0,
      totalSqft: 0,
      sqM: 0,
      totalSqM: 0,
      area: 0,
      totalArea: 0,
      unitLabel: measurementUnit === 'SQ_METER' ? 'm²' : 'sqft',
      rateLabel: measurementUnit === 'SQ_METER' ? '₹/m²' : '₹/sqft',
      qty: 1,
      rate: 0,
      lineTotal: 0
    };
  }

  const qty = Math.max(1, parseFloat(item.quantity) || 1);
  const rate = Math.max(0, parseFloat(item.unitPrice) || 0);

  // 1. Determine width and height in inches
  let widthIn = null;
  let heightIn = null;

  if (item.widthInches !== undefined && item.widthInches !== null && parseFloat(item.widthInches) > 0) {
    widthIn = parseFloat(item.widthInches);
  } else if (item.widthMm !== undefined && item.widthMm !== null && parseFloat(item.widthMm) > 0) {
    widthIn = parseFloat((parseFloat(item.widthMm) / 25.4).toFixed(1));
  }

  if (item.heightInches !== undefined && item.heightInches !== null && parseFloat(item.heightInches) > 0) {
    heightIn = parseFloat(item.heightInches);
  } else if (item.heightMm !== undefined && item.heightMm !== null && parseFloat(item.heightMm) > 0) {
    heightIn = parseFloat((parseFloat(item.heightMm) / 25.4).toFixed(1));
  }

  // 2. Cut Size representation
  let cutSize = '—';
  if (widthIn && heightIn) {
    cutSize = `${widthIn}" × ${heightIn}"`;
  } else if (item.widthMm && item.heightMm) {
    cutSize = `${Number(item.widthMm)} × ${Number(item.heightMm)} mm`;
  }

  // 3. Commercial Billing Size (Rounded to nearest 6-inch grid)
  let roundedW = null;
  let roundedH = null;

  if (item.roundedWidthInches && parseFloat(item.roundedWidthInches) > 0) {
    roundedW = parseFloat(item.roundedWidthInches);
  } else if (widthIn) {
    roundedW = roundDimensionTo6Inches(widthIn);
  }

  if (item.roundedHeightInches && parseFloat(item.roundedHeightInches) > 0) {
    roundedH = parseFloat(item.roundedHeightInches);
  } else if (heightIn) {
    roundedH = roundDimensionTo6Inches(heightIn);
  }

  let billingSize = '—';
  if (roundedW && roundedH) {
    billingSize = `${roundedW}" × ${roundedH}"`;
  } else if (widthIn && heightIn) {
    billingSize = formatBillingSize(widthIn, heightIn);
  }

  // 4. Area: Square Footage and Square Meters
  const isM2 = measurementUnit === 'SQ_METER';
  let sqft = 0;
  let sqM = 0;

  if (item.areaSqFt && parseFloat(item.areaSqFt) > 0) {
    sqft = parseFloat(item.areaSqFt);
  } else if (roundedW && roundedH) {
    sqft = parseFloat(((roundedW * roundedH) / 144).toFixed(2));
  } else if (widthIn && heightIn) {
    sqft = calculateItemSqft(widthIn, heightIn);
  } else if (item.areaSqM && parseFloat(item.areaSqM) > 0) {
    sqft = parseFloat((parseFloat(item.areaSqM) / SQFT_TO_SQM).toFixed(2));
  } else if (rate > 0 && item.totalPrice && parseFloat(item.totalPrice) > 0) {
    if (isM2) {
      sqM = parseFloat((parseFloat(item.totalPrice) / (qty * rate)).toFixed(4));
      sqft = parseFloat((sqM / SQFT_TO_SQM).toFixed(2));
    } else {
      sqft = parseFloat((parseFloat(item.totalPrice) / (qty * rate)).toFixed(2));
    }
  }

  const totalSqft = parseFloat((sqft * qty).toFixed(2));

  if (item.areaSqM && parseFloat(item.areaSqM) > 0) {
    sqM = parseFloat(item.areaSqM);
  } else if (!sqM && sqft > 0) {
    sqM = parseFloat((sqft * SQFT_TO_SQM).toFixed(4));
  }

  const totalSqM = parseFloat((sqM * qty).toFixed(4));

  const area = isM2 ? sqM : sqft;
  const totalArea = isM2 ? totalSqM : totalSqft;

  // 5. Line Total
  let lineTotal = 0;
  if (item.totalPrice !== undefined && item.totalPrice !== null && parseFloat(item.totalPrice) > 0) {
    lineTotal = parseFloat(item.totalPrice);
  } else if (isM2 && totalSqM > 0) {
    lineTotal = parseFloat((totalSqM * rate).toFixed(2));
  } else if (sqft > 0) {
    lineTotal = parseFloat((totalSqft * rate).toFixed(2));
  } else {
    lineTotal = parseFloat((qty * rate).toFixed(2));
  }

  return {
    widthIn,
    heightIn,
    roundedW,
    roundedH,
    cutSize,
    billingSize,
    sqft,
    totalSqft,
    sqM,
    totalSqM,
    area,
    totalArea,
    unitLabel: isM2 ? 'm²' : 'sqft',
    rateLabel: isM2 ? '₹/m²' : '₹/sqft',
    qty,
    rate,
    lineTotal
  };
};
