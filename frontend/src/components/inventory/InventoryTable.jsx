import React from 'react';
import { Edit2, ShieldAlert } from 'lucide-react';
import StockLevelBadge from './StockLevelBadge';
import RackLocationBadge from './RackLocationBadge';
import Badge from '../common/Badge';
import { formatCurrency, formatDimensions } from '../../utils/formatters';

export default function InventoryTable({
  items = [],
  onEditItem,
  onAdjustItem,
}) {
  const getCategoryBadge = (category) => {
    switch (category) {
      case 'FLOAT_SHEET':
        return <Badge variant="primary" size="sm">Float Sheet</Badge>;
      case 'RAW_MATERIAL':
        return <Badge variant="info" size="sm">Raw Interlayer</Badge>;
      case 'FINISHED_GLASS':
        return <Badge variant="success" size="sm">Finished Stock</Badge>;
      case 'HARDWARE_FITTINGS':
        return <Badge variant="purple" size="sm">Hardware</Badge>;
      case 'CONSUMABLE':
        return <Badge variant="warning" size="sm">Consumable</Badge>;
      default:
        return <Badge variant="default" size="sm">{category}</Badge>;
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 uppercase text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-5 py-3 font-semibold">SKU</th>
              <th className="px-5 py-3 font-semibold">Item & Dimensions</th>
              <th className="px-5 py-3 font-semibold">Category</th>
              <th className="px-5 py-3 font-semibold">Available Stock</th>
              <th className="px-5 py-3 font-semibold text-right">Unit Cost</th>
              <th className="px-5 py-3 font-semibold text-right">Selling Price</th>
              <th className="px-5 py-3 font-semibold">Rack / Location</th>
              <th className="px-5 py-3 font-semibold text-center">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-3.5 font-mono font-semibold text-cyan-400">
                  {item.sku}
                </td>
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-slate-200">{item.name}</div>
                  {item.widthMm && item.heightMm ? (
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {formatDimensions(item.widthMm, item.heightMm, item.thicknessMm)}
                    </div>
                  ) : null}
                </td>
                <td className="px-5 py-3.5">{getCategoryBadge(item.category)}</td>
                <td className="px-5 py-3.5">
                  <StockLevelBadge
                    quantity={item.stockQuantity}
                    reorderLevel={item.reorderLevel}
                    unit={item.unitOfMeasure}
                  />
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-slate-300">
                  {formatCurrency(item.unitCost)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono font-semibold text-cyan-400">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="px-5 py-3.5">
                  <RackLocationBadge location={item.rackLocation} />
                </td>
                <td className="px-5 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditItem(item)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Edit Catalog Item"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-300" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onAdjustItem(item)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-950/80 text-amber-400 border border-slate-700 hover:border-amber-700/60 transition-colors"
                      title="Stock Audit / Record Cullet Breakage"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-slate-500 text-sm">
                  No inventory items found matching current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
