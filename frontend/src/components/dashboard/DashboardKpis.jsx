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
    <div className="space-y-3.5">
      {/* Primary Glazing Fabrication KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {primaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white p-4 rounded-lg border border-steel-200 shadow-xs hover:border-steel-300 transition-colors flex items-start justify-between"
            >
              <div>
                <p className="text-[11px] font-bold text-steel-500 uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="text-xl font-mono font-bold text-steel-900 mt-1">
                  {card.value}
                </p>
                <p className="text-[11px] text-steel-500 mt-1">
                  {card.subtitle}
                </p>
              </div>
              <div className={`p-2.5 rounded-lg border ${card.theme}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Operational Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {secondaryStats.map((item, idx) => {
          const ItemIcon = item.icon;
          return (
            <div
              key={idx}
              className="bg-steel-50/80 px-3.5 py-2 rounded-md border border-steel-200/90 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <ItemIcon className="w-3.5 h-3.5 text-steel-500" />
                <span className="text-steel-600 font-medium">{item.label}</span>
              </div>
              <div className="flex items-baseline gap-1 font-mono">
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
