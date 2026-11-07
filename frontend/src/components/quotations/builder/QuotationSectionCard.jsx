import React from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';
import QuotationLineItemRow from './QuotationLineItemRow';
import { calculateLineItemMetrics, formatCurrency, formatSqft } from '../../../lib/glassCalculations';

const QuotationSectionCard = ({
  section,
  sectionIndex,
  products = [],
  onUpdateSectionName,
  onAddItem,
  onRemoveItem,
  onUpdateField,
  onOpenAddSku,
  onRemoveSection,
  canRemoveSection
}) => {
  // Compute section totals
  let sectionSqft = 0;
  let sectionSubtotal = 0;

  (section.items || []).forEach((item) => {
    const metrics = calculateLineItemMetrics(item);
    sectionSqft += metrics.totalSqft;
    sectionSubtotal += metrics.lineTotal;
  });

  return (
    <div className="bg-white rounded-lg border border-steel-200 overflow-hidden shadow-xs">
      {/* Section Header */}
      <div className="px-3.5 py-2.5 bg-steel-50 border-b border-steel-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-edge-800 bg-edge-50 px-2 py-0.5 rounded border border-edge-200 shrink-0">
            <Layers className="w-3 h-3 text-edge-600" />
            SEC-{sectionIndex + 1}
          </span>
          <input
            type="text"
            required
            aria-label={`Name for section ${sectionIndex + 1}`}
            value={section.sectionName}
            onChange={(e) => onUpdateSectionName(sectionIndex, e.target.value)}
            placeholder="Floor / Zone (e.g. 1st Floor, Facade, Master Bedroom)"
            className="text-xs font-semibold text-steel-900 bg-white px-2.5 py-1 rounded border border-steel-300 w-full max-w-sm focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
          />
        </div>

        {/* Section Metrics & Actions */}
        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono text-steel-600 flex items-center gap-2 bg-white px-2.5 py-1 rounded border border-steel-200">
            <span>Area: <strong className="text-steel-900">{formatSqft(sectionSqft)} sqft</strong></span>
            <span className="text-steel-300">|</span>
            <span>Subtotal: <strong className="text-edge-700">{formatCurrency(sectionSubtotal)}</strong></span>
          </div>

          <button
            type="button"
            onClick={() => onAddItem(sectionIndex)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-edge-700 bg-edge-50 hover:bg-edge-100 border border-edge-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Glass Item</span>
          </button>

          {canRemoveSection && (
            <button
              type="button"
              onClick={() => onRemoveSection(sectionIndex)}
              className="p-1 rounded text-steel-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete Section"
              aria-label={`Delete section ${section.sectionName || sectionIndex + 1}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Line Items Table */}
      <div className="overflow-x-auto p-3">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] font-semibold text-steel-500 uppercase tracking-wider border-b border-steel-200 pb-1">
              <th className="pb-1.5 font-medium min-w-[240px]">Glass Specification / SKU</th>
              <th className="pb-1.5 text-right font-medium w-24">Width (in)</th>
              <th className="pb-1.5 text-right font-medium w-24">Height (in)</th>
              <th className="pb-1.5 text-center font-medium w-28">Billing Size</th>
              <th className="pb-1.5 text-right font-medium w-24">Sqft</th>
              <th className="pb-1.5 text-center font-medium w-16">Qty</th>
              <th className="pb-1.5 text-right font-medium w-24">Rate (₹/sqft)</th>
              <th className="pb-1.5 text-right font-medium w-28">Line Total</th>
              <th className="pb-1.5 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {(section.items || []).map((item, itemIdx) => (
              <QuotationLineItemRow
                key={itemIdx}
                item={item}
                sectionIndex={sectionIndex}
                itemIndex={itemIdx}
                products={products}
                onUpdateField={onUpdateField}
                onRemoveItem={onRemoveItem}
                onOpenAddSku={onOpenAddSku}
                canRemove={section.items.length > 1}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuotationSectionCard;
