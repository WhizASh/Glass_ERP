import React from 'react';

/**
 * Normal text indicator for quotation confirmation or cancellation.
 * Replaces the legacy rubber stamp seal graphic with clean text.
 */
const QuotationSeal = ({ status, size = 'md', className = '' }) => {
  const normalized = (status || '').toUpperCase();

  if (
    normalized !== 'CANCELLED' &&
    normalized !== 'CANCEL' &&
    normalized !== 'ACCEPTED' &&
    normalized !== 'CONFIRMED'
  ) {
    return null;
  }

  const isConfirmed = normalized === 'ACCEPTED' || normalized === 'CONFIRMED';
  const text = isConfirmed ? 'Confirm' : 'Cancel';
  const colorClass = isConfirmed ? 'text-emerald-700' : 'text-rose-700';

  const sizeClass = {
    sm: 'text-xs font-semibold',
    md: 'text-sm font-semibold',
    lg: 'text-base font-bold'
  }[size] || 'text-sm font-semibold';

  return (
    <span
      className={`inline-block ${colorClass} ${sizeClass} tracking-wide ${className}`}
      aria-label={`Quotation Status: ${text}`}
    >
      {text}
    </span>
  );
};

export default QuotationSeal;
