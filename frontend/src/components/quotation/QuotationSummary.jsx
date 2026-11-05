import React from 'react';
import Input from '../common/Input';
import { formatCurrency } from '../../utils/formatters';

export default function QuotationSummary({
  subtotal = 0,
  taxPercent = 10,
  onChangeTaxPercent,
  discount = 0,
  onChangeDiscount,
  notes = '',
  onChangeNotes,
}) {
  const taxAmount = (Number(subtotal) * Number(taxPercent || 0)) / 100;
  const grandTotal = Math.max(0, Number(subtotal) + taxAmount - Number(discount || 0));

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
        Billing & Taxes Breakdown
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Discount Allowance ($)"
          type="number"
          min="0"
          step="0.01"
          value={discount}
          onChange={(e) => onChangeDiscount(e.target.value)}
        />
        <Input
          label="Standard Value Added Tax (VAT/GST)"
          type="number"
          min="0"
          max="100"
          suffix="%"
          value={taxPercent}
          onChange={(e) => onChangeTaxPercent(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">
          Quotation Notes / Architectural Project Terms
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => onChangeNotes(e.target.value)}
          placeholder="e.g. Delivery included to site crane. All tempered glass conforms to EN 12150 standard."
          className="w-full text-xs rounded-lg bg-slate-950 border border-slate-700/80 p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
        />
      </div>

      {/* Financial Summary */}
      <div className="border-t border-slate-800 pt-3 space-y-1.5 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Glass Fabrication Subtotal:</span>
          <span className="font-mono text-slate-200">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Taxes ({taxPercent}%):</span>
          <span className="font-mono text-slate-200">{formatCurrency(taxAmount)}</span>
        </div>
        {Number(discount) > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>Special Project Discount:</span>
            <span className="font-mono">-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
          <span>Grand Total Payable:</span>
          <span className="font-mono text-cyan-400 text-base">{formatCurrency(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
