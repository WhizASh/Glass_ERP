import React from 'react';
import { DollarSign, FileSpreadsheet, ShoppingBag, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function MetricCards({ summary = {}, onNavigate }) {
  const cards = [
    {
      id: 'revenue',
      title: 'Facility Revenue',
      value: formatCurrency(summary.totalRevenue || 0),
      subtitle: '+12.4% from last cycle',
      icon: DollarSign,
      glow: 'border-slate-200/90 hover:border-sky-300 hover:shadow-sky-100/50',
      iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
      action: () => onNavigate?.('quotations'),
    },
    {
      id: 'quotes',
      title: 'Active Quotations',
      value: summary.activeQuotesCount ?? 0,
      subtitle: 'Drafts & awaiting fabrication',
      icon: FileSpreadsheet,
      glow: 'border-slate-200/90 hover:border-blue-300 hover:shadow-blue-100/50',
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      action: () => onNavigate?.('quotations'),
    },
    {
      id: 'purchases',
      title: 'Monthly Procurement',
      value: formatCurrency(summary.monthlyPurchasesTotal || 0),
      subtitle: 'Raw float & PVB inventory receipts',
      icon: ShoppingBag,
      glow: 'border-slate-200/90 hover:border-emerald-300 hover:shadow-emerald-100/50',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      action: () => onNavigate?.('purchases'),
    },
    {
      id: 'alerts',
      title: 'Low Stock Alerts',
      value: summary.lowStockCount ?? 0,
      subtitle: summary.lowStockCount > 0 ? 'Requires sheet replenishment' : 'All racks optimal',
      icon: AlertTriangle,
      glow:
        summary.lowStockCount > 0
          ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300 shadow-amber-50'
          : 'border-slate-200/90 hover:border-slate-300',
      iconBg:
        summary.lowStockCount > 0
          ? 'bg-amber-50 text-amber-600 border-amber-200'
          : 'bg-slate-100 text-slate-500 border-slate-200',
      action: () => onNavigate?.('inventory'),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={card.action}
            className={`glass-card p-5 cursor-pointer hover:-translate-y-0.5 transition-all duration-200 border ${card.glow}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                {card.title}
              </span>
              <div className={`p-2.5 rounded-xl border ${card.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-slate-900">{card.value}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}
