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
      color: 'cyan',
      glow: 'shadow-cyan-950/40 border-cyan-500/20',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      action: () => onNavigate?.('quotations'),
    },
    {
      id: 'quotes',
      title: 'Active Quotations',
      value: summary.activeQuotesCount ?? 0,
      subtitle: 'Drafts & awaiting fabrication',
      icon: FileSpreadsheet,
      color: 'blue',
      glow: 'shadow-blue-950/40 border-blue-500/20',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      action: () => onNavigate?.('quotations'),
    },
    {
      id: 'purchases',
      title: 'Monthly Procurement',
      value: formatCurrency(summary.monthlyPurchasesTotal || 0),
      subtitle: 'Raw float & PVB inventory receipts',
      icon: ShoppingBag,
      color: 'emerald',
      glow: 'shadow-emerald-950/40 border-emerald-500/20',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      action: () => onNavigate?.('purchases'),
    },
    {
      id: 'alerts',
      title: 'Low Stock Alerts',
      value: summary.lowStockCount ?? 0,
      subtitle: summary.lowStockCount > 0 ? 'Requires sheet replenishment' : 'All racks optimal',
      icon: AlertTriangle,
      color: 'amber',
      glow: summary.lowStockCount > 0 ? 'shadow-amber-950/50 border-amber-500/30' : 'shadow-slate-900 border-slate-800',
      iconBg: summary.lowStockCount > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700',
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
            className={`glass-card p-5 cursor-pointer hover:-translate-y-1 transition-all duration-200 border ${card.glow}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                {card.title}
              </span>
              <div className={`p-2.5 rounded-xl border ${card.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-white">{card.value}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}
