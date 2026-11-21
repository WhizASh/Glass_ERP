import React from 'react';
import { 
  Layers, 
  Clock, 
  CheckCircle2, 
  IndianRupee, 
  FileText, 
  ShoppingBag, 
  Users, 
  Package 
} from 'lucide-react';

const DashboardKpis = ({ kpis = {} }) => {
  const glazingArea = Number(kpis.totalGlazingArea || 0).toFixed(2);
  const inReview = kpis.inReviewQuotes || 0;
  const accepted = kpis.acceptedQuotes || 0;
  const pipelineValue = Number(kpis.totalPipelineValue || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const primaryCards = [
    {
      title: 'Total Glazing Area',
      value: `${glazingArea} m²`,
      subtitle: 'Quoted glass surface takeoff',
      icon: Layers,
      theme: 'text-teal-700 bg-teal-50 border-teal-200'
    },
    {
      title: 'In Review / Sent',
      value: inReview,
      subtitle: 'Awaiting client approval',
      icon: Clock,
      theme: 'text-sky-700 bg-sky-50 border-sky-200'
    },
    {
      title: 'Accepted / Won',
      value: accepted,
      subtitle: 'Ready for glass fabrication',
      icon: CheckCircle2,
      theme: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    },
    {
      title: 'Pipeline Quote Value',
      value: `₹${pipelineValue}`,
      subtitle: 'Active quoting volume',
      icon: IndianRupee,
      theme: 'text-slate-800 bg-slate-100 border-slate-200'
    }
  ];

  const secondaryStats = [
    { label: 'All Quotations', val: kpis.totalQuotations || 0, icon: FileText },
    { label: 'Production Orders', val: kpis.totalSales || 0, sub: `${kpis.pendingOrders || 0} queue`, icon: ShoppingBag },
    { label: 'Contractor Directory', val: kpis.totalCustomers || 0, icon: Users },
    { label: 'Glass Catalog SKUs', val: kpis.totalProductSkus || 0, icon: Package }
  ];

  return (
    <div className="space-y-3 sm:space-y-3.5">
      {/* Primary Glazing Fabrication KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {primaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white p-3.5 sm:p-4 rounded-lg border border-steel-200 hover:border-steel-300 transition-colors flex items-start justify-between gap-3 min-w-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-steel-600">
                  {card.title}
                </p>
                <p className="text-xl sm:text-2xl tabular-nums font-semibold text-steel-900 mt-1 break-words">
                  {card.value}
                </p>
                <p className="text-xs text-steel-600 mt-1">
                  {card.subtitle}
                </p>
              </div>
              <div className={`p-2 sm:p-2.5 rounded-lg border shrink-0 ${card.theme}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Operational Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        {secondaryStats.map((item, idx) => {
          const ItemIcon = item.icon;
          return (
            <div
              key={idx}
              className="bg-steel-50/80 px-3 py-2 sm:px-3.5 rounded-md border border-steel-200/90 flex items-center justify-between text-sm min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ItemIcon className="w-3.5 h-3.5 text-steel-500 shrink-0" />
                <span className="text-steel-600 font-medium truncate">{item.label}</span>
              </div>
              <div className="flex items-baseline gap-1 tabular-nums shrink-0">
                <span className="font-bold text-steel-900">{item.val}</span>
                {item.sub && <span className="text-[10px] text-steel-400">({item.sub})</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardKpis;
