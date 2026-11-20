import React from 'react';
import { X } from 'lucide-react';

export default function DialogHeader({ titleId, title, subtitle, eyebrow, onClose, closeLabel = 'Close dialog', busy = false, actions }) {
  return (
    <header className="app-dialog-header">
      <div className="min-w-0 flex-1">
        {eyebrow && <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-steel-500">{eyebrow}</div>}
        <h2 id={titleId} className="text-lg font-semibold leading-snug tracking-tight text-steel-900">{title}</h2>
        {subtitle && <p className="mt-1 text-xs leading-relaxed text-steel-500">{subtitle}</p>}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {actions}
        {onClose && <button type="button" onClick={onClose} disabled={busy} aria-label={closeLabel} className="app-dialog-close"><X className="h-4 w-4" aria-hidden="true" /></button>}
      </div>
    </header>
  );
}
