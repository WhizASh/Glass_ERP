import DialogHeader from '../common/DialogHeader';
import React, { useEffect, useRef } from 'react';
import { ArrowRight, Lock, Unlock } from 'lucide-react';
import SaleOrderDetails from './SaleOrderDetails';
import SaleOrderItems from './SaleOrderItems';
import SaleOrderPayment from './SaleOrderPayment';
import SaleOrderSummary from './SaleOrderSummary';
import { secondaryButton } from './saleUi';

export default function SaleOrderModal({ form, setForm, order, customers, quotations, products, totals, locked, delivered, saving, error, nestedDialogOpen, onClose, onSubmit, onQuotationChange, onAddCustomer, onAddItem, onRemoveItem, onUpdateItem, getSqft, getLineTotal, onUnlock }) {
  const dialogRef = useRef(null);
  const errorRef = useRef(null);
  const nestedReturnFocus = useRef(null);
  const close = () => { if (!saving && !nestedDialogOpen) onClose(); };

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);

  useEffect(() => { if (!nestedDialogOpen) nestedReturnFocus.current?.focus(); }, [nestedDialogOpen]);

  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

  const handleKeys = event => {
    if (nestedDialogOpen) return;
    if (event.key === 'Escape') { event.stopPropagation(); close(); }
    if (event.key !== 'Tab') return;
    const controls = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };

  return (
    <div className="app-dialog sale-order-overlay fixed inset-0 z-50 flex items-center justify-center bg-steel-950/60 p-2 backdrop-blur-sm sm:p-5" onKeyDown={handleKeys} onClick={event => { if (event.target === event.currentTarget) close(); }} aria-hidden={nestedDialogOpen || undefined} inert={nestedDialogOpen ? '' : undefined}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="sale-dialog-title" tabIndex={-1} className="sale-order-dialog flex max-h-[calc(100dvh-1rem)] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-steel-200 bg-white shadow-2xl outline-none sm:max-h-[92dvh]">
        <DialogHeader titleId="sale-dialog-title"
          title={locked ? 'Order details' : order ? 'Edit sales order' : 'New sales order'}
          subtitle={locked ? 'This paid order is locked. Unlock it to make changes.' : 'Set up the customer, glass specifications and payment.'}
          eyebrow={<span className="flex items-center gap-2"><span>Sales order</span><span aria-hidden="true">/</span><span className="text-edge-700">{order?.orderNumber || 'New order'}</span></span>}
          onClose={close} busy={saving} closeLabel="Close sales order" />
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="sale-order-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain bg-steel-50/60 p-3 sm:p-4">
            {error && <div ref={errorRef} tabIndex={-1} role="alert" className="mb-5 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 outline-none focus:ring-2 focus:ring-rose-500">{error}</div>}
            {(locked || delivered) && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-steel-200 bg-white px-4 py-3 text-xs text-steel-600"><p className="flex items-center gap-2"><Lock className="h-4 w-4 shrink-0" aria-hidden="true" />{locked ? 'Paid and locked. All details are read-only.' : 'Delivered order. Glass items and pricing are read-only.'}</p>{locked && <button type="button" disabled={saving} onClick={onUnlock} className={secondaryButton}><Unlock className="h-4 w-4" aria-hidden="true" />Unlock order</button>}</div>}
            <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="min-w-0 space-y-4">
                <div className="rounded-lg border border-steel-200 bg-white p-3 sm:p-4"><SaleOrderDetails form={form} setForm={setForm} customers={customers} quotations={quotations} disabled={locked || delivered || saving} onQuotationChange={onQuotationChange} onAddCustomer={() => { nestedReturnFocus.current = document.activeElement; onAddCustomer(); }} /></div>
                <SaleOrderItems items={form.items} products={products} disabled={locked || delivered || saving} onAdd={onAddItem} onRemove={onRemoveItem} onUpdate={onUpdateItem} getSqft={getSqft} getLineTotal={getLineTotal} />
                <div className="rounded-lg border border-steel-200 bg-white p-3 sm:p-4"><SaleOrderPayment form={form} setForm={setForm} locked={locked || saving} /></div>
              </div>
              <SaleOrderSummary form={form} setForm={setForm} totals={totals} disabled={locked || delivered || saving} />
            </div>
          </div>
          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-steel-200 bg-white px-4 py-2 sm:px-5 sm:py-3">
            <p className="hidden text-xs text-steel-500 sm:block">{locked ? 'Read-only order' : 'Fields marked * are required'}<span className="mx-2 text-steel-300">·</span>{totals.totalGlazingSqft.toFixed(2)} sqft</p>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <button type="button" disabled={saving} onClick={close} className={`${secondaryButton} shrink-0`}>{locked ? 'Close' : 'Cancel'}</button>
              {!locked && <button type="submit" disabled={saving} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:flex-none">{form.isLocked && <Lock className="h-4 w-4" aria-hidden="true" />}<span>{saving ? 'Saving…' : order ? (form.isLocked ? 'Save & lock order' : 'Save changes') : (form.isLocked ? 'Create & lock order' : 'Create order')}</span>{!saving && !form.isLocked && <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />}</button>}
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
