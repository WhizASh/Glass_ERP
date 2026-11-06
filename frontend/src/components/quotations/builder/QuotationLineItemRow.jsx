import React from 'react';
import { Trash2 } from 'lucide-react';

const QuotationLineItemRow = ({
  item,
  sectionIndex,
  itemIndex,
  products,
  onUpdateField,
  onRemoveItem,
  canRemove
}) => {
  const width = parseFloat(item.widthMm) || 0;
  const height = parseFloat(item.heightMm) || 0;
  const qty = parseFloat(item.quantity) || 1;
  const price = parseFloat(item.unitPrice) || 0;

  // Glass surface area calculation in m²
  const areaPerPiece = width > 0 && height > 0 ? (width * height) / 1000000 : 0;
  const totalArea = areaPerPiece * qty;
  
  // Total calculation: if area exists, total = qty * area * price, otherwise qty * price
  const lineTotal = areaPerPiece > 0 ? totalArea * price : qty * price;

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
    <tr className="border-b border-steel-100 hover:bg-steel-50/60 transition-colors">
      {/* Product SKU Selector */}
      <td className="py-2.5 pr-2">
        <select
          required
          aria-label="Glass Product SKU"
          value={item.productSkuId || ''}
          onChange={(e) => handleProductChange(e.target.value)}
          className="w-full text-xs py-1.5 px-2 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600 font-medium"
        >
          <option value="">-- Select Glass SKU --</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.skuCode} | {p.name} ({p.thicknessMm}mm) - ₹{Number(p.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/m²
            </option>
          ))}
        </select>
      </td>

      {/* Width (mm) */}
      <td className="py-2.5 px-1.5 w-24">
        <input
          type="number"
          min="1"
          placeholder="e.g. 1200"
          aria-label="Width in millimeters"
          value={item.widthMm || ''}
          onChange={(e) => onUpdateField(sectionIndex, itemIndex, 'widthMm', e.target.value)}
          className="w-full text-xs py-1.5 px-2 text-right font-mono bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
        />
      </td>

      {/* Height (mm) */}
      <td className="py-2.5 px-1.5 w-24">
        <input
          type="number"
          min="1"
          placeholder="e.g. 2400"
          aria-label="Height in millimeters"
          value={item.heightMm || ''}
          onChange={(e) => onUpdateField(sectionIndex, itemIndex, 'heightMm', e.target.value)}
          className="w-full text-xs py-1.5 px-2 text-right font-mono bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
        />
      </td>

      {/* Calculated Area (m²) */}
      <td className="py-2.5 px-1.5 w-24 text-right">
        <span className="font-mono text-xs text-steel-700 bg-steel-100 px-1.5 py-0.5 rounded border border-steel-200">
          {totalArea > 0 ? `${totalArea.toFixed(3)} m²` : '—'}
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

      {/* Unit Rate (₹/m² or per pc) */}
      <td className="py-2.5 px-1.5 w-24">
        <input
          type="number"
          step="0.01"
          min="0"
          required
          aria-label="Unit rate"
          value={item.unitPrice}
          onChange={(e) => onUpdateField(sectionIndex, itemIndex, 'unitPrice', e.target.value)}
          className="w-full text-xs py-1.5 px-2 text-right font-mono bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
        />
      </td>

      {/* Line Total */}
      <td className="py-2.5 pl-2 text-right font-mono font-bold text-xs text-steel-900 w-24">
        ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>

      {/* Actions */}
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
