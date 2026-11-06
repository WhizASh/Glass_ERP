import React from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';
import QuotationLineItemRow from './QuotationLineItemRow';

const QuotationSectionCard = ({
  section,
  sectionIndex,
  products,
  onUpdateSectionName,
  onAddItem,
  onRemoveItem,
  onUpdateField,
  onRemoveSection,
  canRemoveSection
}) => {
  // Compute section totals
  let sectionArea = 0;
  let sectionSubtotal = 0;

  section.items.forEach((item) => {
    const width = parseFloat(item.widthMm) || 0;
    const height = parseFloat(item.heightMm) || 0;
    const qty = parseFloat(item.quantity) || 1;
    const price = parseFloat(item.unitPrice) || 0;
    const itemArea = width > 0 && height > 0 ? (width * height) / 1000000 : 0;
    const totalItemArea = itemArea * qty;
    sectionArea += totalItemArea;
    sectionSubtotal += itemArea > 0 ? totalItemArea * price : qty * price;
  });

  return (
    <div className="bg-white rounded-lg border border-steel-200 overflow-hidden shadow-xs">
      {/* Section Header */}
      <div className="px-3.5 py-2.5 bg-steel-50 border-b border-steel-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-edge-800 bg-edge-50 px-2 py-0.5 rounded border border-edge-200">
            <Layers className="w-3 h-3 text-edge-600" />
            SEC-{sectionIndex + 1}
          </span>
          <input
            type="text"
            required
            aria-label={`Name for section ${sectionIndex + 1}`}
            value={section.sectionName}
            onChange={(e) => onUpdateSectionName(sectionIndex, e.target.value)}
            placeholder="Floor or Zone (e.g. Ground Floor Facade, 1st Floor Balcony Railing)"
            className="text-xs font-semibold text-steel-900 bg-white px-2.5 py-1 rounded border border-steel-300 w-full max-w-sm focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
          />
        </div>

        {/* Section Metrics & Actions */}
        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono text-steel-600 flex items-center gap-2 bg-white px-2.5 py-1 rounded border border-steel-200">
            <span>Area: <strong className="text-steel-900">{sectionArea.toFixed(2)} m²</strong></span>
            <span className="text-steel-300">|</span>
            <span>Subtotal: <strong className="text-edge-700">₹{sectionSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
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
              <th className="pb-1.5 font-medium">Glass Specification / SKU</th>
              <th className="pb-1.5 text-right font-medium w-24">Width (mm)</th>
              <th className="pb-1.5 text-right font-medium w-24">Height (mm)</th>
              <th className="pb-1.5 text-right font-medium w-24">Area (m²)</th>
              <th className="pb-1.5 text-center font-medium w-16">Qty</th>
              <th className="pb-1.5 text-right font-medium w-24">Rate (₹/m²)</th>
              <th className="pb-1.5 text-right font-medium w-24">Line Total (₹)</th>
              <th className="pb-1.5 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {section.items.map((item, itemIdx) => (
              <QuotationLineItemRow
                key={itemIdx}
                item={item}
                sectionIndex={sectionIndex}
                itemIndex={itemIdx}
                products={products}
                onUpdateField={onUpdateField}
                onRemoveItem={onRemoveItem}
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
