import React from 'react';
import { ShoppingBag, Truck } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function RecentPurchasesFeed({ purchases = [], onViewAll }) {
  const purchaseList = Array.isArray(purchases)
    ? purchases
    : Array.isArray(purchases?.data)
    ? purchases.data
    : [];

  return (
    <Card
      title="Recent Raw Material Receipts"
      subtitle="Latest incoming float packs and consumables"
      icon={ShoppingBag}
      action={
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          View All
        </Button>
      }
    >
      <div className="space-y-3 pt-1">
        {purchaseList.map((po) => {
          const supplierName = po.supplierName || po.supplier?.name || po.supplier?.contactPerson || 'General Supplier';
          const purchaseDate = po.purchaseDate || po.createdAt;

          return (
            <div
              key={po.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-50 border border-sky-100 text-sky-600">
                  <Truck className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-800">
                      {supplierName}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {po.orderNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {po.notes || `${po.items?.length || 1} line item(s) received into inventory`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-xs text-slate-900 font-mono">
                  {formatCurrency(po.totalAmount)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {formatDate(purchaseDate)}
                </div>
              </div>
            </div>
          );
        })}

        {purchaseList.length === 0 && (
          <div className="text-center py-6 text-xs text-slate-400">
            No material purchases logged yet.
          </div>
        )}
      </div>
    </Card>
  );
}
