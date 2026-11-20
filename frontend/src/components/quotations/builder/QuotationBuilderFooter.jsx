import React, { useId } from 'react';
import { formatCurrency, formatSqft } from '../../../lib/glassCalculations';

export default function QuotationBuilderFooter({
  discountType = 'PERCENTAGE', onDiscountTypeChange, discountValue = 0,
  onDiscountValueChange, taxRate = 18, onTaxRateChange,
  measurementUnit = 'SQ_FT', totals = {}
}) {
  const id = useId();
  const isPercentage = discountType === 'PERCENTAGE' || discountType === '%';
  const area = measurementUnit === 'SQ_METER'
    ? `${Number(totals.totalSqM ?? (totals.totalSqft || 0) * 0.092903).toFixed(3)} m²`
    : `${formatSqft(totals.totalSqft || 0)} sqft`;
  const rows = [
    ['Fabrication subtotal', totals.subtotal],
    ['Discount', -(totals.discountAmount || 0)],
    ['Taxable amount', totals.taxableSubtotal],
    [`GST (${totals.taxRate || 0}%)`, totals.taxAmount]
  ];

  return (
    <aside aria-label="Quotation summary" className="min-w-0 self-start overflow-hidden rounded-lg border border-edge-200 bg-white lg:sticky lg:top-0">
      <div className="border-b border-edge-200 bg-edge-50 p-4">
        <h3 className="text-sm font-semibold text-edge-800">Quotation summary</h3>
        <p className="mt-2 break-words text-2xl font-semibold tracking-tight tabular-nums text-edge-950" aria-live="polite">{formatCurrency(totals.grandTotal || 0)}</p>
        <p className="mt-1 text-xs text-steel-500">Total glazing area · {area}</p>
      </div>
      <div className="space-y-4 p-4">
        <fieldset className="space-y-3">
          <legend className="sr-only">Pricing adjustments</legend>
          <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-2">
            <div>
              <label htmlFor={`${id}-type`} className="mb-1 block">Type</label>
              <select id={`${id}-type`} value={isPercentage ? 'PERCENTAGE' : 'FIXED'} onChange={event => onDiscountTypeChange(event.target.value)} className="w-full rounded-md">
                <option value="PERCENTAGE">%</option><option value="FIXED">₹</option>
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-discount`} className="mb-1 block">Discount</label>
              <input id={`${id}-discount`} type="number" min="0" max={isPercentage ? '100' : undefined} step="0.01" value={discountValue ?? ''} onChange={event => onDiscountValueChange(event.target.value)} className="w-full rounded-md" />
            </div>
          </div>
          <div>
            <label htmlFor={`${id}-tax`} className="mb-1 block">GST rate (%)</label>
            <input id={`${id}-tax`} type="number" min="0" max="100" step="0.5" value={taxRate} onChange={event => onTaxRateChange(event.target.value)} className="w-full rounded-md" />
          </div>
        </fieldset>
        <dl className="space-y-2 border-t border-steel-200 pt-3 text-xs text-steel-600">
          {rows.map(([label, amount]) => <div key={label} className="flex justify-between gap-3"><dt>{label}</dt><dd className="text-right font-medium tabular-nums text-steel-900">{formatCurrency(amount || 0)}</dd></div>)}
        </dl>
        <div className="flex justify-between gap-3 rounded-md bg-edge-50 px-3 py-2 text-xs font-semibold text-edge-900"><span>Grand total</span><span className="text-right tabular-nums">{formatCurrency(totals.grandTotal || 0)}</span></div>
      </div>
    </aside>
  );
}
