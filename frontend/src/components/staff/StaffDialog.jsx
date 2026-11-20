import { useEffect, useId, useRef, useState } from 'react';
import DialogHeader from '../common/DialogHeader';
import { primary, secondary } from './staffUi';

export function Field({ label, children }) {
  return <label className="block text-sm font-medium text-slate-700"><span className="mb-1 block">{label}</span>{children}</label>;
}

export default function StaffDialog({ title, onClose, onSave, saveLabel, children }) {
  const dialog = useRef(null);
  const titleId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      opener?.focus();
    };
  }, []);

  async function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      await onSave(fields);
      onClose();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog ref={dialog} aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
      className="app-dialog max-w-xl">
      <DialogHeader titleId={titleId} title={title} subtitle="Manage staff details and payroll records." busy={busy} onClose={onClose} />
      <form onSubmit={submit} className="app-dialog-form">
        <div className="app-dialog-fields space-y-3">
        <fieldset disabled={busy} className="min-w-0 space-y-4">{children}</fieldset>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>
        <div className="app-dialog-actions">
          <button type="button" className={secondary} disabled={busy} onClick={onClose}>Cancel</button>
          <button type="submit" className={primary} disabled={busy}>{busy ? 'Working…' : saveLabel}</button>
        </div>
      </form>
    </dialog>
  );
}
