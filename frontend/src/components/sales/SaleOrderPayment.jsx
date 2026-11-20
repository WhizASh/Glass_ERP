import React from 'react';
import { SaleField, SaleSection } from './saleUi';

export default function SaleOrderPayment({ form, setForm, locked }) {
  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  return (
    <SaleSection title="Payment & delivery" subtitle="Record the payment received and where the order should be delivered.">
      <fieldset disabled={locked} className="grid gap-3 sm:grid-cols-2">
        <legend className="sr-only">Payment and delivery details</legend>
        <SaleField label="Payment status *"><select name="paymentStatus" value={form.paymentStatus} onChange={event => setForm(current => ({ ...current, paymentStatus: event.target.value, isLocked: event.target.value === 'PAID' ? current.isLocked : false }))}><option value="UNPAID">Unpaid</option><option value="PARTIAL">Partially paid</option><option value="PAID">Paid in full</option></select></SaleField>
        <SaleField label="Payment mode *"><select name="paymentMode" value={form.paymentMode} onChange={update}><option value="CASH">Cash</option><option value="ONLINE">NEFT / UPI / Card</option></select></SaleField>
        {form.paymentStatus === 'PARTIAL' && <SaleField label="Amount received (₹) *"><input name="amountReceived" type="number" inputMode="decimal" required min="0.01" step="0.01" value={form.amountReceived} onChange={update} /></SaleField>}
        <SaleField label="Payment date (optional)"><input name="paymentDate" type="date" value={form.paymentDate} onChange={update} /></SaleField>
        <SaleField label="Payment reference (optional)"><input name="paymentReference" maxLength={200} value={form.paymentReference} onChange={update} placeholder="Transaction or cheque number" /></SaleField>
        <SaleField label="Delivery address" className="sm:col-span-2"><textarea name="deliveryAddress" rows={2} value={form.deliveryAddress} onChange={update} placeholder="Site or delivery address" /></SaleField>
        {form.paymentStatus === 'PAID' && !locked && <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-steel-200 bg-steel-50 p-3 sm:col-span-2"><input type="checkbox" checked={Boolean(form.isLocked)} onChange={event => setForm(current => ({ ...current, isLocked: event.target.checked }))} className="mt-0.5 h-4 w-4 accent-teal-700 focus-visible:ring-2 focus-visible:ring-teal-600" /><span className="text-xs font-medium text-steel-800">Lock order after saving<span className="mt-1 block font-normal leading-relaxed text-steel-500">Protect this paid order from further changes.</span></span></label>}
      </fieldset>
    </SaleSection>
  );
}
