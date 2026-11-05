import React from 'react';
import { Printer, CheckCircle, CheckCheck, Layers } from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatCurrency, formatDate, formatArea } from '../../utils/formatters';

export default function QuotationDetailModal({
  isOpen,
  onClose,
  quotation,
  onUpdateStatus,
}) {
  if (!quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success" dot size="sm">Completed Order</Badge>;
      case 'CONFIRMED':
        return <Badge variant="primary" dot size="sm">Confirmed / In Production</Badge>;
      case 'DRAFT':
        return <Badge variant="warning" dot size="sm">Draft Estimate</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Quotation Specification: ${quotation.quotationNumber}`}
      subtitle="Architectural billing and glass fabrication order sheet"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 print:text-black">
        {/* Printable Letterhead */}
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center text-white">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-base text-slate-100">VitroGlass Production Facility</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Industrial Plant #4, Architectural Processing Div.
            </p>
            <p className="text-xs text-slate-400">Chicago, IL • support@vitroglass.mock</p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="flex sm:justify-end">{getStatusBadge(quotation.status)}</div>
            <p className="text-xs text-slate-400">
              Date: <span className="text-slate-200 font-medium">{formatDate(quotation.createdAt)}</span>
            </p>
            <p className="text-xs text-slate-400">
              Valid Until: <span className="text-slate-200 font-medium">{formatDate(quotation.validUntil)}</span>
            </p>
          </div>
        </div>

        {/* Customer Info Card */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 font-medium uppercase block text-[10px] tracking-wider mb-1">
              Billed To
            </span>
            <div className="font-bold text-slate-200 text-sm">{quotation.customerName}</div>
            <div className="text-slate-400">{quotation.customerType} Client</div>
            {quotation.customer?.gstin && (
              <div className="text-slate-400 mt-1 font-mono">
                Tax ID / GSTIN: {quotation.customer.gstin}
              </div>
            )}
          </div>
          <div>
            <span className="text-slate-500 font-medium uppercase block text-[10px] tracking-wider mb-1">
              Delivery / Site Details
            </span>
            <div className="text-slate-300">
              {quotation.customer?.shippingAddress || quotation.notes || 'Factory dispatch / Standard delivery'}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Glass Item & Spec</th>
                <th className="px-4 py-2.5 font-semibold">Dimensions</th>
                <th className="px-4 py-2.5 font-semibold">Surface Area</th>
                <th className="px-4 py-2.5 font-semibold">Edge / CNC Work</th>
                <th className="px-4 py-2.5 font-semibold text-center">Qty</th>
                <th className="px-4 py-2.5 font-semibold text-right">Unit Rate</th>
                <th className="px-4 py-2.5 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
              {quotation.items?.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="px-4 py-3 font-medium text-slate-200">
                    {item.glassTypeName || item.glassType}
                    <span className="block text-[10px] text-slate-500">{item.thicknessMm} mm</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {item.widthMm} × {item.heightMm} mm
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatArea(item.areaSqM)}</td>
                  <td className="px-4 py-3 text-slate-400">
                    <div>{item.edgeWorkName || item.edgeWork}</div>
                    {item.holesCount > 0 && (
                      <span className="text-[10px] text-cyan-400">{item.holesCount} hole(s)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-200">{item.quantity}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-300">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-cyan-400">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-xs text-slate-400 max-w-sm">
            <span className="font-semibold text-slate-300 block mb-1">Production Terms</span>
            <p>{quotation.notes || 'All glass manufactured according to safety glazing standards. Subject to standard ±2mm cutting tolerance.'}</p>
          </div>

          <div className="w-full sm:w-64 space-y-1.5 text-xs text-right">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono text-slate-200">{formatCurrency(quotation.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Taxes:</span>
              <span className="font-mono text-slate-200">{formatCurrency(quotation.taxAmount)}</span>
            </div>
            {quotation.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount:</span>
                <span className="font-mono">-{formatCurrency(quotation.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
              <span>Grand Total:</span>
              <span className="font-mono text-cyan-400 text-base">
                {formatCurrency(quotation.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Status Transition & Print Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Change Status:</span>
            {quotation.status === 'DRAFT' && (
              <Button
                size="sm"
                variant="primary"
                icon={CheckCircle}
                onClick={() => onUpdateStatus(quotation.id, 'CONFIRMED')}
              >
                Confirm Order
              </Button>
            )}
            {quotation.status === 'CONFIRMED' && (
              <Button
                size="sm"
                variant="primary"
                icon={CheckCheck}
                onClick={() => onUpdateStatus(quotation.id, 'COMPLETED')}
              >
                Mark Fabrication Completed
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={Printer} onClick={handlePrint}>
              Print / Save PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
