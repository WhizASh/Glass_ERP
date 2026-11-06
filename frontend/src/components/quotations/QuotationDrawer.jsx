import React, { useEffect, useState } from 'react';
import { X, Printer, Send, CheckCircle2, Ban } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import QuotationDrawerSchedule from './QuotationDrawerSchedule';
import { api } from '../../services/api';

const QuotationDrawer = ({ quotation, onClose, onStatusUpdated }) => {
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!quotation) return null;

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await api.updateQuotationStatus(quotation.id, newStatus);
      if (onStatusUpdated) onStatusUpdated(quotation.id, newStatus);
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  let totalArea = 0;
  (quotation.sections || []).forEach((sec) => {
    (sec.items || []).forEach((item) => {
      totalArea += (Number(item.areaSqM) || 0) * (Number(item.quantity) || 1);
    });
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="fixed inset-0 z-50 overflow-hidden flex justify-end"
    >
      <div onClick={onClose} className="fixed inset-0 bg-steel-950/40 backdrop-blur-xs transition-opacity" />

      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-steel-200 z-10 animate-in slide-in-from-right duration-200">
        <div className="px-5 py-3.5 bg-[#0f172a] text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-edge-400 bg-edge-950 px-2 py-0.5 rounded border border-edge-800">
                {quotation.quoteNumber}
              </span>
              <StatusBadge status={quotation.status} />
            </div>
            <h2 id="drawer-title" className="text-sm font-semibold text-white mt-1">
              {quotation.customer?.companyName || quotation.customer?.name}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="p-1.5 rounded-md text-steel-400 hover:text-white hover:bg-steel-800 transition-colors"
              title="Print Schedule"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-steel-400 hover:text-white hover:bg-steel-800 transition-colors"
              aria-label="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-steel-700">
          <div className="bg-steel-50 p-3 rounded-lg border border-steel-200 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase text-steel-500">Pipeline Action:</span>
            <div className="flex items-center gap-1.5">
              {quotation.status === 'DRAFT' && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleStatusChange('SENT')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sky-600 text-white hover:bg-sky-700 font-semibold text-xs shadow-xs"
                >
                  <Send className="w-3 h-3" /> Mark Sent
                </button>
              )}
              {quotation.status !== 'ACCEPTED' && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleStatusChange('ACCEPTED')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-xs shadow-xs"
                >
                  <CheckCircle2 className="w-3 h-3" /> Accept Quote
                </button>
              )}
              {quotation.status !== 'CANCELLED' && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleStatusChange('CANCELLED')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold"
                >
                  <Ban className="w-3 h-3" /> Cancel
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-steel-200">
            <div>
              <span className="text-[10px] uppercase font-semibold text-steel-400 block">Client / Firm</span>
              <p className="font-bold text-steel-900 mt-0.5">{quotation.customer?.companyName || '—'}</p>
              <p className="text-steel-600">Contact: {quotation.customer?.name || '—'}</p>
              {quotation.customer?.email && <p className="text-steel-500">{quotation.customer.email}</p>}
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-steel-400 block">Key Dates</span>
              <p className="mt-0.5">Issue: <strong className="font-mono text-steel-800">{new Date(quotation.issueDate).toLocaleDateString()}</strong></p>
              <p>Valid Until: <strong className="font-mono text-steel-800">{quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : '30 Days'}</strong></p>
            </div>
          </div>

          <QuotationDrawerSchedule sections={quotation.sections} />

          <div className="bg-steel-50 p-3.5 rounded-lg border border-steel-200 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-steel-600">
              <span>Total Glazing Area:</span>
              <span className="font-bold text-steel-900">{totalArea.toFixed(3)} m²</span>
            </div>
            <div className="flex justify-between text-steel-600">
              <span>Subtotal:</span>
              <span>₹{Number(quotation.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-steel-600">
              <span>GST ({Number(quotation.taxRate)}%):</span>
              <span>₹{Number(quotation.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-steel-200 text-steel-900">
              <span>Grand Total:</span>
              <span className="text-edge-700 font-extrabold">₹{Number(quotation.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {quotation.notes && (
            <div className="p-3 bg-white rounded-lg border border-steel-200">
              <span className="text-[10px] uppercase font-semibold text-steel-400 block mb-1">Notes & Terms</span>
              <p className="text-xs text-steel-700 whitespace-pre-wrap">{quotation.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotationDrawer;
