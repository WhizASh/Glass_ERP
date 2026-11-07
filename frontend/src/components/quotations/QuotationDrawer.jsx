import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Send, CheckCircle2, Ban, Edit3 } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import QuotationSeal from '../common/QuotationSeal';
import QuotationDrawerSchedule from './QuotationDrawerSchedule';
import QuotationPrintView from './QuotationPrintView';
import { api } from '../../services/api';
import { formatCurrency, formatSqft, getItemDisplayMetrics } from '../../lib/glassCalculations';

const QuotationDrawer = ({ quotation, onClose, onStatusUpdated, onEditQuotation }) => {
  const [updating, setUpdating] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [renderedQuotation, setRenderedQuotation] = useState(quotation);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (quotation) {
      setRenderedQuotation(quotation);
      // Trigger smooth slide-in animation on next frame
      const frame = requestAnimationFrame(() => {
        setIsOpen(true);
      });
      return () => cancelAnimationFrame(frame);
    } else {
      setIsOpen(false);
      const timer = setTimeout(() => {
        setRenderedQuotation(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [quotation]);

  const handleSmoothClose = () => {
    setIsOpen(false);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setRenderedQuotation(null);
      onClose();
    }, 300); // Wait for 300ms slide-out transition
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isPrintOpen) handleSmoothClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [isPrintOpen]);

  if (!quotation && !renderedQuotation) return null;
  const currentQuote = quotation || renderedQuotation;

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await api.updateQuotationStatus(currentQuote.id, newStatus);
      if (onStatusUpdated) onStatusUpdated(currentQuote.id, newStatus);
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Compute accurate total area in sqft using universal display metrics
  let totalSqft = 0;
  (currentQuote.sections || []).forEach((sec) => {
    const items = Array.isArray(sec.items) ? sec.items : (sec.items?.create || []);
    items.forEach((item) => {
      const metrics = getItemDisplayMetrics(item);
      totalSqft += metrics.totalSqft;
    });
  });

  const subtotal = Number(currentQuote.subtotal) || 0;
  const discountAmount = Number(currentQuote.discountAmount) || 0;
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const taxRate = Number(currentQuote.taxRate) || 0;
  const taxAmount = Number(currentQuote.taxAmount) || 0;
  const grandTotal = Number(currentQuote.totalAmount) || 0;

  const drawerContent = (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={`fixed inset-0 z-[100] overflow-hidden no-print ${
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Smooth Fading Backdrop */}
        <div
          onClick={handleSmoothClose}
          className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 ease-out ${
            isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Top-to-Bottom Full Screen Height Panel with Smooth Slide Animation */}
        <div
          className={`fixed top-0 bottom-0 right-0 w-full max-w-2xl bg-white h-screen shadow-2xl flex flex-col border-l border-slate-200 z-10 transition-transform duration-300 ease-in-out transform ${
            isOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'
          }`}
        >
          {/* Header */}
          <div className="px-5 py-3.5 bg-[#0f172a] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-teal-300 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                  {currentQuote.quoteNumber}
                </span>
                <StatusBadge status={currentQuote.status} />
              </div>
              <h2 id="drawer-title" className="text-sm font-semibold text-white mt-1">
                {currentQuote.customer?.companyName || currentQuote.customer?.name}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPrintOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
                title="Print or Save PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>
              <button
                type="button"
                onClick={handleSmoothClose}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drawer Body (Scrollable from top to bottom) */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-steel-700">
            {/* Pipeline Action Bar */}
            <div className="bg-steel-50 p-3 rounded-lg border border-steel-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase text-steel-500">Pipeline Action:</span>
              <div className="flex items-center gap-1.5">
                {(currentQuote.status === 'DRAFT' || currentQuote.status === 'SENT') && onEditQuotation && (
                  <button
                    type="button"
                    onClick={() => onEditQuotation(currentQuote)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-steel-100 text-steel-700 border border-steel-300 font-semibold text-xs shadow-2xs transition-colors"
                  >
                    <Edit3 className="w-3 h-3 text-edge-600" /> Edit Quote
                  </button>
                )}
                {currentQuote.status === 'DRAFT' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleStatusChange('SENT')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sky-600 text-white hover:bg-sky-700 font-semibold text-xs shadow-xs"
                  >
                    <Send className="w-3 h-3" /> Mark Sent
                  </button>
                )}
                {currentQuote.status !== 'ACCEPTED' && currentQuote.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleStatusChange('ACCEPTED')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-xs shadow-xs"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Accept Quote
                  </button>
                )}
                {currentQuote.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleStatusChange('CANCELLED')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold"
                  >
                    <Ban className="w-3 h-3" /> Cancel
                  </button>
                )}
                {currentQuote.status === 'CANCELLED' && (
                  <span className="text-xs text-rose-600 font-medium italic px-1">
                    Quotation Cancelled (Permanently Closed)
                  </span>
                )}
              </div>
            </div>

            {/* Client Info Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-white rounded-lg border border-steel-200 shadow-2xs items-center">
              {/* Left: Client / Firm */}
              <div>
                <span className="text-[10px] uppercase font-bold text-steel-500 block">Client / Firm</span>
                <p className="font-bold text-steel-900 mt-0.5 text-sm truncate">
                  {currentQuote.customer?.companyName || currentQuote.customer?.name || '—'}
                </p>
                {currentQuote.customer?.companyName && currentQuote.customer?.name && (
                  <p className="text-steel-600 truncate">Contact: {currentQuote.customer.name}</p>
                )}
                {currentQuote.customer?.city && <p className="text-steel-600">City: {currentQuote.customer.city}</p>}
                {currentQuote.customer?.email && <p className="text-steel-500 font-mono truncate">{currentQuote.customer.email}</p>}
              </div>

              {/* Middle: Quotation Date */}
              <div className="sm:border-l sm:border-steel-200 sm:pl-4">
                <span className="text-[10px] uppercase font-bold text-steel-500 block">Quotation Date</span>
                <p className="font-mono text-steel-900 font-bold text-sm mt-0.5 whitespace-nowrap">
                  {currentQuote.issueDate
                    ? new Date(currentQuote.issueDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })
                    : new Date().toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                </p>
                {currentQuote.customer?.taxId && (
                  <p className="mt-0.5 text-[11px] text-steel-500 font-mono whitespace-nowrap">
                    GSTIN: <span className="font-semibold uppercase text-steel-700">{currentQuote.customer.taxId}</span>
                  </p>
                )}
              </div>

              {/* Right: Official Rubber Stamp Seal */}
              <div className="flex sm:justify-end items-center">
                {(currentQuote.status === 'CANCELLED' || currentQuote.status === 'ACCEPTED') && (
                  <QuotationSeal status={currentQuote.status} size="md" />
                )}
              </div>
            </div>

            {/* Architectural Schedule Table */}
            <QuotationDrawerSchedule sections={currentQuote.sections} />

            {/* Commercial Totals Card */}
            <div className="bg-steel-50 p-3.5 rounded-lg border border-steel-200 space-y-1.5 font-mono text-xs shadow-2xs">
              <div className="flex justify-between text-steel-600">
                <span>Total Glazing Area:</span>
                <span className="font-bold text-steel-900">
                  {formatSqft(totalSqft)} sq.ft <span className="text-steel-400 font-normal">({(totalSqft * 0.092903).toFixed(2)} m²)</span>
                </span>
              </div>
              <div className="flex justify-between text-steel-600">
                <span>Fabrication Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount {currentQuote.discountType === 'PERCENTAGE' ? `(${currentQuote.discountValue}%)` : '(Fixed)'}:</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-steel-600">
                  <span>Taxable Subtotal:</span>
                  <span>{formatCurrency(taxableSubtotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-steel-600">
                <span>Estimated GST ({taxRate}%):</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-steel-200 text-steel-900">
                <span>Grand Total:</span>
                <span className="text-teal-700 font-extrabold">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Notes & Terms */}
            {currentQuote.notes && (
              <div className="p-3 bg-white rounded-lg border border-steel-200">
                <span className="text-[10px] uppercase font-semibold text-steel-400 block mb-1">Notes &amp; Terms</span>
                <p className="text-xs text-steel-700 whitespace-pre-wrap">{currentQuote.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Dedicated Print / PDF View */}
      {isPrintOpen && (
        <QuotationPrintView
          quotation={currentQuote}
          onClose={() => setIsPrintOpen(false)}
        />
      )}
    </>
  );

  return typeof document !== 'undefined'
    ? createPortal(drawerContent, document.body)
    : drawerContent;
};

export default QuotationDrawer;