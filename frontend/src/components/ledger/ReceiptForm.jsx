import React, { useEffect, useRef, useState } from 'react';
import Modal from '../common/Modal';
import { api } from '../../services/api';
import { paymentLabels } from './LedgerTables';

const inputClass = 'mt-1 block min-h-11 w-full rounded-md border border-steel-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20';

export default function ReceiptForm({ customer, sales = [], onClose, onSaved }) {
  const [form, setForm] = useState({ saleOrderId: sales.find(sale => !sale.isLocked && sale.paymentStatus !== 'PAID')?.id || '', paymentDate: new Date().toLocaleDateString('en-CA'), amount: '', paymentType: 'CASH', reference: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef(null);
  const submitting = useRef(false);
  useEffect(() => {
    const previous = document.activeElement;
    formRef.current?.querySelector('input')?.focus();
    return () => previous?.focus();
  }, []);
  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async event => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setError('');
    try {
      await api.createLedgerReceipt(customer.id, form);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };
  const trapFocus = event => {
    if (event.key !== 'Tab') return;
    const dialog = formRef.current.closest('[role="dialog"]');
    const elements = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  return (
    <div onKeyDown={trapFocus}>
      <Modal isOpen busy={saving} onClose={() => { if (!submitting.current) onClose(); }} title="Record receipt" subtitle={customer.companyName || customer.name} maxWidth="max-w-lg">
        <form ref={formRef} onSubmit={submit} className="app-dialog-form text-xs">
          <div className="app-dialog-fields space-y-3">
          <p className="text-xs text-steel-500">Choose a sale to add this payment to its total received and update its payment status. Date and reference describe the latest payment.</p>
          {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <fieldset disabled={saving} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-steel-700 sm:col-span-2">Apply payment to<select name="saleOrderId" required value={form.saleOrderId} onChange={update} className={inputClass}><option value="">Select an unpaid sale</option>{sales.filter(sale => !sale.isLocked && sale.paymentStatus !== 'PAID').map(sale => <option key={sale.id} value={sale.id}>{sale.orderNumber}</option>)}</select></label>
            <label className="text-xs font-medium text-steel-700">Payment date<input className={inputClass} type="date" name="paymentDate" required value={form.paymentDate} onChange={update} /></label>
            <label className="text-xs font-medium text-steel-700">Amount (₹)<input className={inputClass} type="number" inputMode="decimal" min="0.01" max="999999999999.99" step="0.01" name="amount" required placeholder="0.00" value={form.amount} onChange={update} /></label>
            <label className="text-xs font-medium text-steel-700">Payment type<select className={inputClass} name="paymentType" value={form.paymentType} onChange={update}>{Object.entries(paymentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="text-xs font-medium text-steel-700">Reference (optional)<input className={inputClass} name="reference" maxLength={200} value={form.reference} onChange={update} /></label>
          </fieldset>
          </div>
          <div className="app-dialog-actions">
            <button type="button" disabled={saving} onClick={onClose} className="min-h-11 rounded-md border border-steel-300 px-4 text-sm hover:bg-steel-50 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50">{saving ? 'Saving…' : 'Save receipt'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
