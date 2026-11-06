import React from 'react';

const QuotationBuilderFooter = ({
  notes,
  onNotesChange,
  overallArea,
  subtotal,
  taxRate,
  tax,
  grandTotal
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2">
      <div>
        <label className="block text-xs font-semibold text-steel-700 mb-1">
          Commercial Terms & Fabrication Notes
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Include lead times, edge polishing tolerances, tempering stamps, transport/crating..."
          className="w-full text-xs p-2 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
        />
      </div>

      <div className="bg-steel-50 rounded-lg border border-steel-200 p-3.5 space-y-1.5 font-mono text-xs">
        <div className="flex justify-between text-steel-600">
          <span>Total Glass Area:</span>
          <span className="font-bold text-steel-900">{overallArea.toFixed(3)} m²</span>
        </div>
        <div className="flex justify-between text-steel-600">
          <span>Fabrication Subtotal:</span>
          <span className="font-semibold">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-steel-600">
          <span>Estimated GST ({taxRate}%):</span>
          <span className="font-semibold">₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-steel-200 text-steel-900">
          <span>Grand Total:</span>
          <span className="text-edge-700 font-extrabold">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
};

export default QuotationBuilderFooter;
