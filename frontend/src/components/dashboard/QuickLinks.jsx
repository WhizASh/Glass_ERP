import React from 'react';
import { PlusCircle, ShoppingCart, Box, UserPlus } from 'lucide-react';
import Button from '../common/Button';

export default function QuickLinks({
  onNewQuotation,
  onNewPurchase,
  onNewInventory,
  onNewCustomer,
}) {
  return (
    <div className="glass-card p-4 border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Fast Dispatch:
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          size="sm"
          variant="primary"
          icon={PlusCircle}
          onClick={onNewQuotation}
        >
          New Quotation
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={ShoppingCart}
          onClick={onNewPurchase}
        >
          Record Purchase
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={Box}
          onClick={onNewInventory}
        >
          Add Inventory SKU
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={UserPlus}
          onClick={onNewCustomer}
        >
          Register Customer
        </Button>
      </div>
    </div>
  );
}
