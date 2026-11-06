/**
 * Formatting utilities for VitroGlass ERP.
 */

export function formatCurrency(amount, currency = 'INR') {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatNumber(val, decimals = 2) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatDimensions(widthMm, heightMm, thicknessMm) {
  if (thicknessMm) {
    return `${widthMm} × ${heightMm} mm (${thicknessMm}mm)`;
  }
  return `${widthMm} × ${heightMm} mm`;
}

export function formatArea(areaSqm) {
  const num = Number(areaSqm) || 0;
  return `${num.toFixed(2)} m²`;
}

export function formatWeight(weightKg) {
  const num = Number(weightKg) || 0;
  return `${num.toFixed(1)} kg`;
}

export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}
