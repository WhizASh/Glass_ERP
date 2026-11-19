import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { button, primary, secondary } from './staffUi';

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
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/50">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
        <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
        <button type="button" disabled={busy} onClick={onClose} aria-label="Close dialog" className={button + ' border-transparent'}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <form onSubmit={submit} className="space-y-4 p-5">
        <fieldset disabled={busy} className="min-w-0 space-y-4">{children}</fieldset>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
          <button type="button" className={secondary} disabled={busy} onClick={onClose}>Cancel</button>
          <button type="submit" className={primary} disabled={busy}>{busy ? 'Working…' : saveLabel}</button>
        </div>
      </form>
    </dialog>
  );
}
