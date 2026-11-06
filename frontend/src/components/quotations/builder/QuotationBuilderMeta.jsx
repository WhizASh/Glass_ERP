import React from 'react';
import { AlertCircle } from 'lucide-react';

const QuotationBuilderMeta = ({
  formData,
  setFormData,
  customers
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-3.5 bg-steel-50 rounded-lg border border-steel-200">
      <div>
        <label className="block text-xs font-semibold text-steel-700 mb-1">Customer / Project *</label>
        <select
          required
          value={formData.customerId}
          onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
          className="w-full text-xs py-1.5 px-2 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600 font-medium"
        >
          <option value="">-- Select Client / Contractor --</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName ? `${c.companyName} (${c.name})` : c.name}
            </option>
          ))}
        </select>
        {customers.length === 0 && (
          <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Add customers in Customers tab first.
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-steel-700 mb-1">Quote Validity Date</label>
        <input
          type="date"
          value={formData.validUntil}
          onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
          className="w-full text-xs py-1.5 px-2 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-steel-700 mb-1">Applicable GST (%)</label>
        <input
          type="number"
          min="0"
          max="100"
          value={formData.taxRate}
          onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
          className="w-full text-xs py-1.5 px-2 text-right font-mono bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
        />
      </div>
    </div>
  );
};

export default QuotationBuilderMeta;
