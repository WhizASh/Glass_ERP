import React from 'react';
import { UserPlus } from 'lucide-react';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const QuotationBuilderMeta = ({
  formData,
  setFormData,
  customers = [],
  onOpenAddCustomer,
  onUnitChange
}) => {
  const currentDate = formData.validUntil || getTodayDateString();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5 p-3 sm:p-3.5 bg-steel-50 rounded-lg border border-steel-200">
      <div>
        <div className="flex items-center justify-between mb-1 gap-1">
          <label className="text-xs font-semibold text-steel-700 truncate">
            Customer / Client <span className="text-rose-600 font-bold" aria-hidden="true">*</span>
          </label>
          {onOpenAddCustomer && (
            <button
              type="button"
              onClick={onOpenAddCustomer}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-edge-700 hover:text-edge-800 transition-colors shrink-0"
            >
              <UserPlus className="w-3 h-3" />
              <span>+ Add</span>
            </button>
          )}
        </div>
        <select
          required
          aria-label="Customer or Project Client"
          value={formData.customerId || ''}
          onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
          className="w-full text-xs py-1.5 px-2 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600 font-medium"
        >
          <option value="">-- Select Client / Contractor --</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName && c.companyName !== c.name
                ? `${c.companyName} (${c.name})`
                : (c.companyName || c.name)} {c.city ? `· ${c.city}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-steel-700">
            Date <span className="text-rose-600 font-bold" aria-hidden="true">*</span>
          </label>
          <span className="text-[10px] text-steel-400 font-mono">Today</span>
        </div>
        <input
          type="date"
          required
          aria-label="Quotation Date"
          value={currentDate}
          onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
          className="w-full text-xs py-1.5 px-2 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600 font-medium"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-steel-700">
            Conversion Unit
          </label>
          <span className="text-[10px] text-teal-700 font-mono font-semibold">
            {formData.measurementUnit === 'SQ_METER' ? 'm²' : 'sqft'}
          </span>
        </div>
        <select
          aria-label="Quotation Conversion Unit"
          value={formData.measurementUnit || 'SQ_FT'}
          onChange={(e) => {
            const newUnit = e.target.value;
            if (onUnitChange) {
              onUnitChange(newUnit);
            } else {
              setFormData({ ...formData, measurementUnit: newUnit });
            }
          }}
          className="w-full text-xs py-1.5 px-2 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600 font-medium font-mono"
        >
          <option value="SQ_FT">Square Feet (sqft)</option>
          <option value="SQ_METER">Square Meters (m²)</option>
        </select>
      </div>

    </div>
  );
};

export default QuotationBuilderMeta;
