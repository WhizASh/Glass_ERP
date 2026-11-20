import React from 'react';
import { SaleField, money } from './saleUi';

export default function SaleOrderSummary({ form, setForm, totals, disabled }) {
  const received = form.paymentStatus === 'PAID' ? totals.totalAmount : form.paymentStatus === 'PARTIAL' ? Number(form.amountReceived) || 0 : 0;
  return (
    <aside className="min-w-0 self-start overflow-hidden rounded-lg border border-edge-200 bg-white lg:sticky lg:top-0" aria-label="Order summary">
      <div className="border-b border-edge-200 bg-edge-50 p-4"><h3 className="text-sm font-semibold text-edge-800">Order summary</h3><p className="mt-2 break-words text-2xl font-semibold tracking-tight tabular-nums text-edge-950">{money(totals.totalAmount)}</p><p className="mt-1 text-xs text-steel-500">{form.items.length} {form.items.length === 1 ? 'item' : 'items'} · {totals.totalGlazingSqft.toFixed(2)} sqft</p></div>
      <div className="space-y-4 p-4">
        <fieldset disabled={disabled} className="space-y-3">
          <legend className="sr-only">Pricing adjustments</legend>
          <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-2">
            <SaleField label="Type"><select aria-label="Discount type" value={form.discountType || 'PERCENTAGE'} onChange={event => setForm(current => ({ ...current, discountType: event.target.value }))}><option value="PERCENTAGE">%</option><option value="FIXED">₹</option></select></SaleField>
            <SaleField label="Discount"><input type="number" min="0" step="0.01" placeholder="0" value={form.discountValue || ''} onChange={event => setForm(current => ({ ...current, discountValue: parseFloat(event.target.value) || 0 }))} /></SaleField>
          </div>
          <SaleField label="GST rate"><select name="taxRate" value={form.taxRate || 0} onChange={event => setForm(current => ({ ...current, taxRate: Number(event.target.value) }))}>{[0, 5, 12, 18].map(rate => <option key={rate} value={rate}>{rate}% GST</option>)}</select></SaleField>
        </fieldset>
        <dl className="space-y-2 text-xs text-steel-600">
          <div className="flex justify-between gap-3"><dt>Subtotal</dt><dd className="font-medium tabular-nums text-steel-900">{money(totals.subtotal)}</dd></div>
          <div className="flex justify-between gap-3"><dt>Discount</dt><dd className="font-medium tabular-nums text-steel-900">−{money(totals.discountAmount)}</dd></div>
          <div className="flex justify-between gap-3"><dt>Taxable amount</dt><dd className="font-medium tabular-nums text-steel-900">{money(totals.taxableSubtotal)}</dd></div>
          <div className="flex justify-between gap-3"><dt>GST ({totals.taxRate}%)</dt><dd className="font-medium tabular-nums text-steel-900">{money(totals.taxAmount)}</dd></div>
        </dl>
        <dl className="space-y-2 border-t border-steel-200 pt-3 text-xs"><div className="flex justify-between gap-3 text-steel-600"><dt>Amount received</dt><dd className="tabular-nums">{money(received)}</dd></div><div className="flex justify-between gap-3 rounded-md bg-edge-50 px-3 py-2 font-semibold text-edge-900"><dt>Outstanding</dt><dd className="tabular-nums">{money(totals.totalAmount - received)}</dd></div></dl>
      </div>
    </aside>
  );
}
