import { useEffect, useId, useRef } from 'react';
import DialogHeader from './DialogHeader';

export default function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-2xl', busy = false }) {
  const dialog = useRef(null);
  const titleId = useId();
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
  useEffect(() => {
    if (!isOpen) return;
    const element = dialog.current;
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    element.showModal();
    element.querySelector('input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')?.focus();
    document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; opener?.focus(); };
  }, [isOpen]);
  if (!isOpen) return null;
  const close = () => { if (!busy) onClose(); };
  return <dialog ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`app-dialog ${maxWidth}`}
    onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
    }}
    onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }}
    onClick={event => {
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.target === event.currentTarget && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) close();
    }}>
    <DialogHeader titleId={titleId} title={title} subtitle={subtitle} onClose={close} busy={busy} />
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
  </dialog>;
}
