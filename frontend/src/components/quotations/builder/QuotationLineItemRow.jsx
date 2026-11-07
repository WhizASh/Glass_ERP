import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { calculateLineItemMetrics, formatCurrency } from '../../../lib/glassCalculations';

const QuotationLineItemRow = ({
  item,
  sectionIndex,
  itemIndex,
  products = [],
  onUpdateField,
  onRemoveItem,
  onOpenAddSku,
  canRemove
}) => {
  const metrics = calculateLineItemMetrics(item);

  const handleProductChange = (productId) => {
    onUpdateField(sectionIndex, itemIndex, 'productSkuId', productId);
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      onUpdateField(sectionIndex, itemIndex, 'unitPrice', Number(prod.unitPrice));
      onUpdateField(
        sectionIndex,
        itemIndex,
        'description',
        `${prod.name} (${prod.thicknessMm}mm - ${prod.glassType})`
      );
    }
  };

  return (
    <tr className="border-b border-steel-100 hover:bg-steel-50/70 transition-colors">
      {/* Product SKU Selector + Quick Add SKU */}
      <td className="py-2.5 pr-2 min-w-[240px]">
        <div className="flex items-center gap-1.5">
          <select
            required
            aria-label="Glass Product SKU"
            value={item.productSkuId || ''}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full text-xs py-1.5 px-2 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600 font-medium"
          >
            <option value="">-- Select Glass Specification --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.skuCode} | {p.name} ({p.thicknessMm}mm) - ₹{Number(p.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/sqft
              </option>
            ))}
          </select>
          {onOpenAddSku && (
            <button
              type="button"
              onClick={() => onOpenAddSku(sectionIndex, itemIndex)}
              className="p-1.5 rounded-md text-edge-700 bg-edge-50 hover:bg-edge-100 border border-edge-200 transition-colors shrink-0"
              title="Add New Glass SKU In-Place"
              aria-label="Add New Glass SKU"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>

      {/* Width (in) */}
      <td className="py-2.5 px-1.5 w-24">
        <input
          type="number"
          step="0.1"
          min="1"
          required
          placeholder="e.g. 57"
          aria-label="Width in inches"
          value={item.widthInches !== undefined && item.widthInches !== null ? item.widthInches : ''}
          onChange={(e) => onUpdateField(sectionIndex, itemIndex, 'widthInches', e.target.value)}
          className="w-full text-xs py-1.5 px-2 text-right font-mono bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
        />
      </td>

      {/* Height (in) */}
      <td className="py-2.5 px-1.5 w-24">
        <input
          type="number"
          step="0.1"
          min="1"
          required
          placeholder="e.g. 44"
          aria-label="Height in inches"
          value={item.heightInches !== undefined && item.heightInches !== null ? item.heightInches : ''}
          onChange={(e) => onUpdateField(sectionIndex, itemIndex, 'heightInches', e.target.value)}
          className="w-full text-xs py-1.5 px-2 text-right font-mono bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
        />
      </td>

      {/* Commercial Billing Size (Rounded to nearest 6-inch grid) */}
      <td className="py-2.5 px-1.5 w-28 text-center">
        <span
          className={`font-mono text-xs px-2 py-0.5 rounded border inline-block ${
            metrics.billingSizeText !== '—'
              ? 'text-edge-800 bg-edge-50 border-edge-200 font-semibold'
              : 'text-steel-400 bg-steel-50 border-steel-200'
          }`}
          title="Rounded up to commercial 6-inch billing slab"
        >
          {metrics.billingSizeText}
        </span>
      </td>

      {/* Calculated Sqft (Per piece) */}
      <td className="py-2.5 px-1.5 w-24 text-right">
        <span className="font-mono text-xs text-steel-800 bg-steel-100 px-1.5 py-0.5 rounded border border-steel-200 font-semibold">
          {metrics.sqft > 0 ? `${metrics.sqft.toFixed(2)}` : '—'}
        </span>
      </td>

      {/* Quantity */}
      <td className="py-2.5 px-1.5 w-16">
        <input
          type="number"
          min="1"
          required
          aria-label="Quantity"
          value={item.quantity}
          onChange={(e) => onUpdateField(sectionIndex, itemIndex, 'quantity', e.target.value)}
          className="w-full text-xs py-1.5 px-1 text-center font-mono font-semibold bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
        />
      </td>

      {/* Unit Rate (₹/sqft) */}
      <td className="py-2.5 px-1.5 w-24">
        <input
          type="number"
          step="0.01"
          min="0"
          required
          aria-label="Unit rate in rupees per square foot"
          value={item.unitPrice}
          onChange={(e) => onUpdateField(sectionIndex, itemIndex, 'unitPrice', e.target.value)}
          className="w-full text-xs py-1.5 px-2 text-right font-mono bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
        />
      </td>

      {/* Line Total */}
      <td className="py-2.5 pl-2 text-right font-mono font-bold text-xs text-steel-900 w-28 whitespace-nowrap">
        {formatCurrency(metrics.lineTotal)}
      </td>

      {/* Action: Remove */}
      <td className="py-2.5 pl-1.5 text-center w-8">
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemoveItem(sectionIndex, itemIndex)}
            className="p-1 rounded text-steel-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Remove line item"
            aria-label="Remove line item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </td>
    </tr>
  );
};

export default QuotationLineItemRow;
