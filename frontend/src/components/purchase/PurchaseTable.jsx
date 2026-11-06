import React, { useState } from 'react';
import { Search, Eye } from 'lucide-react';
import PurchaseStatusBadge from './PurchaseStatusBadge';
import Input from '../common/Input';
import Select from '../common/Select';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function PurchaseTable({ purchases = [], suppliers = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filteredPurchases = purchases.filter((po) => {
    const sName = po.supplierName || po.supplier?.name || po.supplier?.contactPerson || '';
    const orderNo = po.orderNumber || '';
    const notesText = po.notes || '';
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      orderNo.toLowerCase().includes(term) ||
      sName.toLowerCase().includes(term) ||
      notesText.toLowerCase().includes(term);

    const matchesSupplier = !selectedSupplier || po.supplierId === selectedSupplier;

    return matchesSearch && matchesSupplier;
  });

  const supplierFilterOptions = [
    { value: '', label: 'All Suppliers' },
    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80">
          <Input
            icon={Search}
            placeholder="Search PO#, supplier or remarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-64">
          <Select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            options={supplierFilterOptions}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 font-semibold">PO Number</th>
                <th className="px-5 py-3 font-semibold">Supplier / Source</th>
                <th className="px-5 py-3 font-semibold">Receipt Date</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Total Amount</th>
                <th className="px-5 py-3 font-semibold text-center">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.map((po) => {
                const isExpanded = expandedId === po.id;
                return (
                  <React.Fragment key={po.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : po.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono font-semibold text-sky-600">
                        {po.orderNumber}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {po.supplierName || po.supplier?.name || po.supplier?.contactPerson || 'General Supplier'}
                        </div>
                        {po.notes && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">
                            {po.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {formatDate(po.purchaseDate)}
                      </td>
                      <td className="px-5 py-3.5">
                        <PurchaseStatusBadge status={po.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-emerald-600 font-mono text-sm">
                        {formatCurrency(po.totalAmount)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-sky-600" />
                          <span>{po.items?.length || 1} line(s)</span>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/80 border-b border-slate-200">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="rounded-lg bg-white border border-slate-200 p-4 shadow-2xs">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                              Material Line Items Breakdown
                            </h4>
                            <div className="space-y-2">
                              {po.items?.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-none"
                                >
                                  <div>
                                    <span className="font-medium text-slate-800">
                                      {item.itemName || item.item?.name || 'Material Item'}
                                    </span>
                                    <span className="text-slate-500 ml-2">
                                      ({item.quantity} {item.unitOfMeasure || item.item?.unitOfMeasure || 'units'} @ {formatCurrency(item.unitCost)}/unit)
                                    </span>
                                  </div>
                                  <div className="font-mono font-semibold text-slate-900">
                                    {formatCurrency(item.totalCost)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No purchase orders match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
