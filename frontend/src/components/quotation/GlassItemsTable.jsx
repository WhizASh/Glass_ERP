import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, formatArea } from '../../utils/formatters';

export default function GlassItemsTable({
  items = [],
  editingIndex = null,
  onEditItem,
  onRemoveItem,
}) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
        Quotation Line Items ({items.length})
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2 font-medium">Glass Specification</th>
              <th className="px-4 py-2 font-medium">Dimensions</th>
              <th className="px-4 py-2 font-medium">Area</th>
              <th className="px-4 py-2 font-medium">Fabrication</th>
              <th className="px-4 py-2 font-medium text-center">Qty</th>
              <th className="px-4 py-2 font-medium text-right">Unit Price</th>
              <th className="px-4 py-2 font-medium text-right">Total</th>
              <th className="px-4 py-2 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <tr
                key={item.id || index}
                className={`hover:bg-slate-50/80 transition-colors ${
                  editingIndex === index ? 'bg-amber-50/70' : ''
                }`}
              >
                <td className="px-4 py-2.5 font-medium text-slate-900">
                  {item.glassTypeName || item.glassType}
                  <span className="block text-[10px] text-slate-500">{item.thicknessMm}mm</span>
                </td>
                <td className="px-4 py-2.5 text-slate-700 font-mono">
                  {item.widthMm} × {item.heightMm} mm
                </td>
                <td className="px-4 py-2.5 text-slate-600">{formatArea(item.areaSqM)}</td>
                <td className="px-4 py-2.5 text-slate-600">
                  <div>{item.edgeWorkName || item.edgeWork}</div>
                  {item.holesCount > 0 && (
                    <span className="text-[10px] text-sky-700 font-semibold">
                      {item.holesCount} CNC hole(s)
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-center font-semibold text-slate-900">{item.quantity}</td>
                <td className="px-4 py-2.5 text-right text-slate-700 font-mono">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-slate-900 font-mono">
                  {formatCurrency(item.lineTotal)}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditItem(index)}
                      className="text-amber-600 hover:text-amber-800 p-1 rounded hover:bg-amber-100/60 transition-colors"
                      title="Edit This Pane"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(index)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors"
                      title="Remove Pane"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
