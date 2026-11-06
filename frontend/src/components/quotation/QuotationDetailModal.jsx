import React from 'react';
import { Printer, CheckCircle, CheckCheck, Layers, Pencil, Trash2, Send } from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatCurrency, formatDate, formatArea } from '../../utils/formatters';

export default function QuotationDetailModal({
  isOpen,
  onClose,
  quotation,
  onUpdateStatus,
  onEditQuote,
  onDeleteQuote,
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
      case 'ISSUED':
        return <Badge variant="info" dot size="sm">Issued to Client</Badge>;
      case 'DRAFT':
        return <Badge variant="warning" dot size="sm">Draft Estimate</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger" size="sm">Cancelled</Badge>;
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
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center text-white">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-base text-slate-900">VitroGlass Production Facility</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Industrial Plant #4, Architectural Processing Div.
            </p>
            <p className="text-xs text-slate-500">Mumbai, Maharashtra • support@vitroglass.in</p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="flex sm:justify-end">{getStatusBadge(quotation.status)}</div>
            <p className="text-xs text-slate-500">
              Date: <span className="text-slate-800 font-medium">{formatDate(quotation.createdAt)}</span>
            </p>
            <p className="text-xs text-slate-500">
              Valid Until: <span className="text-slate-800 font-medium">{formatDate(quotation.validUntil)}</span>
            </p>
          </div>
        </div>

        {/* Customer Info Card */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs shadow-2xs">
          <div>
            <span className="text-slate-500 font-medium uppercase block text-[10px] tracking-wider mb-1">
              Billed To
            </span>
            <div className="font-bold text-slate-900 text-sm">
              {quotation.customerName || quotation.customer?.companyName || quotation.customer?.name || 'Direct Client'}
            </div>
            <div className="text-slate-500">
              {quotation.customerType || quotation.customer?.type || 'INDIVIDUAL'} Client
            </div>
            {quotation.customer?.gstin && (
              <div className="text-slate-600 mt-1 font-mono">
                Tax ID / GSTIN: {quotation.customer.gstin}
              </div>
            )}
          </div>
          <div>
            <span className="text-slate-500 font-medium uppercase block text-[10px] tracking-wider mb-1">
              Delivery / Site Details
            </span>
            <div className="text-slate-700">
              {quotation.customer?.shippingAddress || quotation.notes || 'Factory dispatch / Standard delivery'}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
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
            <tbody className="divide-y divide-slate-100 bg-white">
              {quotation.items?.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {item.glassTypeName || item.glassType}
                    <span className="block text-[10px] text-slate-500">{item.thicknessMm} mm</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-mono">
                    {item.widthMm} × {item.heightMm} mm
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatArea(item.areaSqM)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{item.edgeWorkName || item.edgeWork}</div>
                    {item.holesCount > 0 && (
                      <span className="text-[10px] text-sky-700 font-semibold">{item.holesCount} hole(s)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-900">{item.quantity}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-xs text-slate-600 max-w-sm">
            <span className="font-semibold text-slate-800 block mb-1">Production Terms</span>
            <p>{quotation.notes || 'All glass manufactured according to safety glazing standards. Subject to standard ±2mm cutting tolerance.'}</p>
          </div>

          <div className="w-full sm:w-64 space-y-1.5 text-xs text-right">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-mono text-slate-800">{formatCurrency(quotation.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Taxes:</span>
              <span className="font-mono text-slate-800">{formatCurrency(quotation.taxAmount)}</span>
            </div>
            {quotation.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount:</span>
                <span className="font-mono">-{formatCurrency(quotation.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Grand Total:</span>
              <span className="font-mono text-sky-700 text-base">
                {formatCurrency(quotation.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Status Transition & Print Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Change Status:</span>
            {(quotation.status === 'DRAFT' || quotation.status === 'ISSUED') && onEditQuote && (
              <Button size="sm" variant="outline" icon={Pencil} onClick={() => { onClose(); onEditQuote(quotation); }}>
                Edit Specifications
              </Button>
            )}
            {quotation.status === 'DRAFT' && (
              <Button size="sm" variant="primary" icon={Send} onClick={() => onUpdateStatus(quotation.id, 'ISSUED')}>
                Issue to Client
              </Button>
            )}
            {quotation.status === 'ISSUED' && (
              <Button size="sm" variant="primary" icon={CheckCircle} onClick={() => onUpdateStatus(quotation.id, 'CONFIRMED')}>
                Confirm Order
              </Button>
            )}
            {quotation.status === 'CONFIRMED' && (
              <Button size="sm" variant="primary" icon={CheckCheck} onClick={() => onUpdateStatus(quotation.id, 'COMPLETED')}>
                Mark Fabrication Completed
              </Button>
            )}
            {onDeleteQuote && (quotation.status === 'DRAFT' || quotation.status === 'ISSUED' || quotation.status === 'CANCELLED') && (
              <Button size="sm" variant="danger" icon={Trash2} onClick={() => { onClose(); onDeleteQuote(quotation.id); }}>
                Delete Quote
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
