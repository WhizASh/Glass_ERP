import React, { useId } from 'react';

export const fieldClass = 'sale-field block w-full min-w-0 rounded-md border border-steel-300 bg-white px-3 py-2 text-sm text-steel-900 transition-colors placeholder:text-steel-400 hover:border-steel-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:border-steel-200 disabled:bg-steel-100 disabled:text-steel-500';
export const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-steel-300 bg-white px-3 text-sm font-medium text-steel-700 transition-colors hover:bg-steel-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-50';
export const money = value => Number(value).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function SaleField({ label, children, hint, className = '' }) {
  // Unique labels for repeated item fields: https://react.dev/reference/react/useId
  const id = useId();
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-steel-600">{label}</label>
      {React.cloneElement(children, { id, className: `${fieldClass} ${children.props.className || ''}`, 'aria-describedby': hint ? `${id}-hint` : undefined })}
      {hint && <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-steel-500">{hint}</p>}
    </div>
  );
}

export function SaleSection({ title, subtitle, children, action }) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-sm font-semibold text-edge-800">{title}</h3>{subtitle && <p className="mt-1 text-xs leading-relaxed text-steel-500">{subtitle}</p>}</div>
        {action}
      </div>
      {children}
    </section>
  );
}
