import { useEffect, useId, useRef, useState } from 'react';
import DialogHeader from '../common/DialogHeader';
import { materialUnits } from '../../lib/materialUnits';
import { api } from '../../services/api';

export default function InventoryDialog({ item, deleting = false, onClose, onSaved }) {
  const dialog = useRef(null);
  const submitting = useRef(false);
  const titleId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ materialName: item?.materialName || '', unitOfMeasure: item?.unitOfMeasure || 'PCS', quantity: item?.quantity ?? '0', notes: item?.notes || '' });
  const linked = Boolean(item?._count?.purchases);

  // Native modal dialogs provide focus containment and make the background inert.
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement;
    element.showModal();
    element.querySelector(deleting ? 'form button[type="button"]' : 'input')?.focus();
    return () => { element.close(); opener?.focus(); };
  }, [deleting]);

  const change = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      if (deleting) await api.deleteInventoryItem(item.id, item.revision);
      else if (item) await api.updateInventoryItem(item.id, { ...form, revision: item.revision });
      else await api.createInventoryItem(form);
      onSaved(deleting ? 'Inventory item deleted.' : 'Inventory item saved.');
    } catch (failure) { setError(failure.message); }
    finally { submitting.current = false; setBusy(false); }
  }

  return (
    <dialog ref={dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (!submitting.current) onClose(); }} className="app-dialog max-w-xl">
      <DialogHeader titleId={titleId} title={deleting ? 'Delete inventory item' : item ? 'Edit inventory item' : 'Add inventory item'} subtitle={deleting ? 'Remove this item from inventory.' : 'Manage the available quantity of a raw material.'} busy={busy} onClose={onClose} />
      <form onSubmit={submit} className="app-dialog-form">
        <div className="app-dialog-fields space-y-4">
          {deleting ? <p className="break-words text-sm leading-relaxed">Delete <strong>{item.materialName}</strong> with {Number(item.quantity).toLocaleString('en-IN', { maximumFractionDigits: 3 })} {materialUnits[item.unitOfMeasure]} available? This removes its current stock record.</p> : <>
            <fieldset disabled={busy} className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">Material name *
                <input name="materialName" required maxLength={200} value={form.materialName} onChange={change} readOnly={linked} aria-describedby={linked ? `${titleId}-linked` : undefined} className="mt-1 block w-full" placeholder="e.g. 6mm clear float glass" />
              </label>
              <label className="block">Unit of measure *
                <select name="unitOfMeasure" value={form.unitOfMeasure} onChange={change} disabled={linked} className="mt-1 block w-full">
                  {Object.entries(materialUnits).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="block">Available quantity *
                <input name="quantity" required type="number" min="0" max="999999999999999.999" step="0.001" value={form.quantity} onChange={change} aria-describedby={`${titleId}-quantity`} className="mt-1 block w-full" />
              </label>
              <label className="block sm:col-span-2">Notes
                <textarea name="notes" maxLength={2000} rows={3} value={form.notes} onChange={change} className="mt-1 block w-full" placeholder="Stock location or reason for a quantity adjustment" />
              </label>
            </fieldset>
            <p id={`${titleId}-quantity`} className="text-xs leading-relaxed text-steel-600">Enter the total stock available now. New purchases add to this quantity; sales do not deduct stock.</p>
            {linked && <p id={`${titleId}-linked`} className="text-xs leading-relaxed text-steel-600">This item is linked to purchases. Change its material or unit in the purchase register. To record used stock, edit the available quantity. Linked items cannot be deleted.</p>}
          </>}
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        </div>
        <div className="app-dialog-actions">
          <button type="button" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" disabled={busy}>{busy ? 'Saving…' : deleting ? 'Delete item' : 'Save item'}</button>
        </div>
      </form>
    </dialog>
  );
}
