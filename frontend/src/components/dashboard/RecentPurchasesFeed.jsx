import React from 'react';
import { ShoppingBag, Truck } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function RecentPurchasesFeed({ purchases = [], onViewAll }) {
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
        {purchases.map((po) => (
          <div
            key={po.id}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-200">
                    {po.supplierName}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {po.orderNumber}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  {po.notes || `${po.items?.length || 1} line item(s) received into inventory`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-xs text-emerald-400">
                {formatCurrency(po.totalAmount)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {formatDate(po.purchaseDate)}
              </div>
            </div>
          </div>
        ))}

        {purchases.length === 0 && (
          <div className="text-center py-6 text-xs text-slate-500">
            No material purchases logged yet.
          </div>
        )}
      </div>
    </Card>
  );
}
