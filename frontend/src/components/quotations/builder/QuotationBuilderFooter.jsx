import React from 'react';
import { Percent, IndianRupee, Tag } from 'lucide-react';
import { formatCurrency, formatSqft } from '../../../lib/glassCalculations';

const QuotationBuilderFooter = ({
  notes = '',
  onNotesChange,
  discountType = 'PERCENTAGE',
  onDiscountTypeChange,
  discountValue = 0,
  onDiscountValueChange,
  totals = {}
}) => {
  const isPercentage = discountType === 'PERCENTAGE' || discountType === '%';
  const sqftVal = totals.totalSqft || 0;
  const sqMVal = sqftVal > 0 ? (sqftVal * 0.092903).toFixed(2) : '0.00';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2">
      {/* Terms & Notes and Discount Modifier */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-steel-700 mb-1">
            Commercial Terms & Fabrication Notes
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Include fabrication lead time, glass warranty, edge polishing tolerances, transport/crating terms..."
            className="w-full text-xs p-2 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
          />
        </div>

        {/* Commercial Discount Modifier */}
        <div className="bg-slate-100 rounded-lg border border-slate-300 p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-teal-700" />
              <span>Commercial Discount Modifier</span>
            </label>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-700">
              {isPercentage ? 'Deduction: %' : 'Deduction: ₹ Fixed'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            {/* High-Contrast Segmented Toggle */}
            <div className="inline-flex rounded-lg border border-slate-300 bg-slate-200/90 p-1 shadow-inner shrink-0">
              <button
                type="button"
                onClick={() => onDiscountTypeChange('PERCENTAGE')}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  isPercentage
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Percentage (%)</span>
              </button>
              <button
                type="button"
                onClick={() => onDiscountTypeChange('FIXED')}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  !isPercentage
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
                }`}
              >
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Fixed (₹)</span>
              </button>
            </div>

            {/* Discount Value input with high contrast */}
            <div className="relative flex-1">
              <input
                type="number"
                min="0"
                step={isPercentage ? '0.5' : '100'}
                max={isPercentage ? '100' : undefined}
                placeholder={isPercentage ? 'Discount % (e.g. 5)' : 'Discount ₹ (e.g. 5000)'}
                value={discountValue !== undefined && discountValue !== null ? discountValue : ''}
                onChange={(e) => onDiscountValueChange(e.target.value)}
                className="w-full text-xs py-1.5 px-3 font-mono font-bold text-right bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 shadow-2xs"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400 pointer-events-none">
                {isPercentage ? '%' : '₹'}
              </span>
            </div>
          </div>

          <p className="text-[11px] font-medium text-slate-600 mt-2 bg-white/70 px-2 py-1 rounded border border-slate-200">
            {isPercentage
              ? `Calculates ${parseFloat(discountValue) || 0}% discount (${formatCurrency(totals.discountAmount || 0)}) on fabrication subtotal before GST`
              : `Deducts fixed ${formatCurrency(discountValue || 0)} from fabrication subtotal before GST`}
          </p>
        </div>
      </div>

      {/* Commercial Summary Card */}
      <div className="bg-steel-50 rounded-lg border border-steel-200 p-3.5 space-y-2 font-mono text-xs">
        <div className="flex justify-between text-steel-600">
          <span>Total Glazing Area:</span>
          <span className="font-bold text-steel-900">
            {formatSqft(sqftVal)} sqft <span className="font-normal text-steel-400">({sqMVal} m²)</span>
          </span>
        </div>

        <div className="flex justify-between text-steel-600">
          <span>Fabrication Subtotal:</span>
          <span className="font-semibold text-steel-800">
            {formatCurrency(totals.subtotal || 0)}
          </span>
        </div>

        {totals.discountAmount > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span className="flex items-center gap-1">
              <span>Discount {isPercentage ? `(${totals.discountValue}%)` : ''}:</span>
            </span>
            <span className="font-semibold">
              -{formatCurrency(totals.discountAmount)}
            </span>
          </div>
        )}

        {totals.discountAmount > 0 && (
          <div className="flex justify-between text-steel-600">
            <span>Taxable Subtotal:</span>
            <span className="font-semibold text-steel-800">
              {formatCurrency(totals.taxableSubtotal || 0)}
            </span>
          </div>
        )}

        <div className="flex justify-between text-steel-600">
          <span>Estimated GST ({totals.taxRate || 0}%):</span>
          <span className="font-semibold text-steel-800">
            {formatCurrency(totals.taxAmount || 0)}
          </span>
        </div>

        <div className="flex justify-between text-sm font-bold pt-2 border-t border-steel-200 text-steel-900">
          <span>Grand Total:</span>
          <span className="text-edge-700 font-extrabold text-base">
            {formatCurrency(totals.grandTotal || 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuotationBuilderFooter;
