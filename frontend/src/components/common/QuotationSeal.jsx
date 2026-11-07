import React from 'react';

/**
 * Authentic Rubber Stamp Seal for Quotations
 * - CANCELLED: Red stamp with double border, rotated, showing CANCELLED / VOID
 * - CONFIRMED: Emerald stamp with double border, rotated, showing CONFIRMED / ORDER ACCEPTED
 */
const QuotationSeal = ({ status, size = 'md', className = '' }) => {
  const normalized = (status || '').toUpperCase();

  if (normalized !== 'CANCELLED' && normalized !== 'ACCEPTED') {
    return null;
  }

  const isCancelled = normalized === 'CANCELLED';

  const config = isCancelled
    ? {
        text: 'CANCELLED',
        subtext: 'VOID · NOT VALID FOR SUPPLY',
        colorClass: 'text-red-700 border-red-700 bg-red-50/40',
        ringClass: 'border-red-700/90'
      }
    : {
        text: 'CONFIRMED',
        subtext: 'ORDER ACCEPTED · FOR FABRICATION',
        colorClass: 'text-emerald-700 border-emerald-700 bg-emerald-50/40',
        ringClass: 'border-emerald-700/90'
      };

  const sizeClasses = {
    sm: {
      outer: 'px-2 py-0.5 border-2 rounded shadow-2xs',
      inner: 'px-1.5 py-0.5 border border-dashed',
      title: 'text-[11px] font-black tracking-widest',
      sub: null,
      rotationClass: isCancelled ? '-rotate-6' : '-rotate-3'
    },
    md: {
      outer: 'px-3.5 py-1 border-[3px] rounded-md shadow-xs',
      inner: 'px-2 py-0.5 border border-dashed',
      title: 'text-sm font-black tracking-[0.2em]',
      sub: 'text-[7.5px] font-bold tracking-[0.12em] mt-0.5',
      rotationClass: isCancelled ? '-rotate-12' : '-rotate-6'
    },
    lg: {
      outer: 'px-5 py-2 border-4 rounded-md shadow-sm',
      inner: 'px-3.5 py-1 border-2 border-dashed',
      title: 'text-xl font-black tracking-[0.25em]',
      sub: 'text-[9px] font-extrabold tracking-[0.18em] mt-0.5',
      rotationClass: isCancelled ? '-rotate-12' : '-rotate-6'
    }
  }[size] || {
    outer: 'px-3.5 py-1 border-[3px] rounded-md shadow-xs',
    inner: 'px-2 py-0.5 border border-dashed',
    title: 'text-sm font-black tracking-[0.2em]',
    sub: 'text-[7.5px] font-bold tracking-[0.12em] mt-0.5',
    rotationClass: isCancelled ? '-rotate-12' : '-rotate-6'
  };

  return (
    <div
      aria-label={`Official Quotation Seal: ${config.text}`}
      className={`inline-flex flex-col items-center justify-center select-none pointer-events-none transform font-mono uppercase text-center transition-transform ${sizeClasses.rotationClass} ${config.colorClass} ${sizeClasses.outer} ${className}`}
      style={{
        boxShadow: 'inset 0 0 0 1px currentColor, 0 1px 3px rgba(0,0,0,0.08)'
      }}
    >
      <div className={`w-full flex ${sizeClasses.sub ? 'flex-col' : 'items-center'} items-center justify-center ${config.ringClass} ${sizeClasses.inner}`}>
        <span className={`${sizeClasses.title} leading-none font-serif font-black`}>
          {config.text}
        </span>
        {sizeClasses.sub && config.subtext && (
          <span className={`${sizeClasses.sub} leading-tight`}>
            {config.subtext}
          </span>
        )}
      </div>
    </div>
  );
};

export default QuotationSeal;
