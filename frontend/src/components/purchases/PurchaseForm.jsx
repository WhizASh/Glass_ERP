import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';

export const money = value => `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const units = { PCS: 'Pieces', SQ_METER: 'Square metres (m²)', SQ_FEET: 'Square feet (ft²)', KG: 'Kilograms (kg)' };
const inputClass = 'min-h-11 sm:min-h-0 w-full px-2.5 py-2 rounded-md border border-steel-300 text-steel-900 bg-white focus:outline-none focus:ring-2 focus:ring-edge-600';

export default function PurchaseForm({ onSaved, onClose, onSavingChange }) {
  const formRef = useRef(null);
  const submitting = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() => ({
    materialName: '', supplier: '', purchaseDate: new Date().toLocaleDateString('en-CA'),
    unitOfMeasure: 'PCS', quantity: '', unitPrice: '', additionalCost: '0', notes: ''
  }));

  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = formRef.current.closest('[role="dialog"]');
    formRef.current.querySelector('input').focus();
    const trapFocus = event => {
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    dialog.addEventListener('keydown', trapFocus);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.removeEventListener('keydown', trapFocus);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  const change = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const estimatedTotal = Number(form.quantity) * Number(form.unitPrice) + Number(form.additionalCost);
  const submit = async event => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true);
    onSavingChange(true);
    setError('');
    try {
      await api.createPurchase(form);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      submitting.current = false;
      setSaving(false);
      onSavingChange(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-4 text-xs">
      <fieldset disabled={saving} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <label className="block font-semibold text-steel-700 sm:col-span-2">
          Material name *
          <input name="materialName" required maxLength={200} value={form.materialName} onChange={change} className={`${inputClass} mt-1`} placeholder="e.g. 6mm clear float glass" />
        </label>
        <label className="block font-semibold text-steel-700">
          Supplier
          <input name="supplier" maxLength={200} value={form.supplier} onChange={change} className={`${inputClass} mt-1`} />
        </label>
        <label className="block font-semibold text-steel-700">
          Purchase date *
          <input name="purchaseDate" type="date" required value={form.purchaseDate} onChange={change} className={`${inputClass} mt-1`} />
        </label>
        <label className="block font-semibold text-steel-700">
          Quantity *
          <input name="quantity" type="number" required min="0.001" max="999999999.999" step="0.001" value={form.quantity} onChange={change} className={`${inputClass} mt-1`} />
        </label>
        <label className="block font-semibold text-steel-700">
          Unit of measure *
          <select name="unitOfMeasure" value={form.unitOfMeasure} onChange={change} className={`${inputClass} mt-1`}>
            {Object.entries(units).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="block font-semibold text-steel-700">
          Unit price (₹) *
          <input name="unitPrice" type="number" required min="0" max="999999999999.99" step="0.01" value={form.unitPrice} onChange={change} className={`${inputClass} mt-1`} />
        </label>
        <label className="block font-semibold text-steel-700">
          Additional purchase costs (₹)
          <input name="additionalCost" type="number" required min="0" max="999999999999.99" step="0.01" value={form.additionalCost} onChange={change} aria-describedby="purchase-cost-help" className={`${inputClass} mt-1`} />
          <span id="purchase-cost-help" className="block mt-1 font-normal text-steel-500">Transport, handling, or other purchase expenses.</span>
        </label>
        <label className="block font-semibold text-steel-700 sm:col-span-2">
          Notes
          <textarea name="notes" rows={2} maxLength={2000} value={form.notes} onChange={change} className={`${inputClass} mt-1`} />
        </label>
      </fieldset>
      <div className="rounded-md border border-steel-200 bg-steel-50 p-3 flex flex-wrap justify-between gap-2">
        <div><span className="font-semibold">Total purchase cost</span><p className="text-steel-500 mt-1">Quantity × unit price + additional costs</p></div>
        <output className="font-mono font-bold text-sm" aria-live="polite">{money(Number.isFinite(estimatedTotal) ? estimatedTotal : 0)}</output>
      </div>
      {error && <p role="alert" className="text-rose-700">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-steel-200 pt-3">
        <button type="button" disabled={saving} onClick={onClose} className="min-h-11 sm:min-h-0 px-4 py-2 rounded-md border border-steel-300 font-semibold disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={saving} className="min-h-11 sm:min-h-0 px-4 py-2 rounded-md bg-teal-700 hover:bg-teal-800 text-white font-semibold disabled:opacity-50">{saving ? 'Saving…' : 'Save Purchase'}</button>
      </div>
    </form>
  );
}
