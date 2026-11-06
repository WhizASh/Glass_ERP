import React from 'react';

const StatusBreakdownView = ({ statusBreakdown = {}, totalStatusArea = 1, winRate = 0 }) => {
  const statuses = [
    { label: 'Accepted / Won', st: 'ACCEPTED', color: 'bg-emerald-600' },
    { label: 'In Review / Sent', st: 'SENT', color: 'bg-sky-500' },
    { label: 'Drafting Phase', st: 'DRAFT', color: 'bg-slate-400' },
    { label: 'Archived / Cancelled', st: 'CANCELLED', color: 'bg-rose-400' }
  ];

  return (
    <div className="py-3 space-y-4">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-steel-600">Glazing Area Distribution by Status</span>
        <span className="font-mono text-steel-900 font-bold">Conversion Rate: {winRate}% Won</span>
      </div>

      {/* Segmented Progress Bar */}
      <div className="h-6 w-full rounded-md bg-steel-100 flex overflow-hidden border border-steel-200">
        {['ACCEPTED', 'SENT', 'DRAFT', 'CANCELLED'].map((st) => {
          const info = statusBreakdown[st] || { areaSqM: 0 };
          const pct = (info.areaSqM / totalStatusArea) * 100;
          if (pct <= 0) return null;
          const color = st === 'ACCEPTED' ? 'bg-emerald-600' : st === 'SENT' ? 'bg-sky-500' : st === 'DRAFT' ? 'bg-slate-400' : 'bg-rose-400';
          return (
            <div
              key={st}
              style={{ width: `${pct}%` }}
              className={`${color} relative group transition-all`}
              title={`${st}: ${info.areaSqM.toFixed(1)} m² (${pct.toFixed(0)}%)`}
            />
          );
        })}
      </div>

      {/* Status Breakdown Legend & Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {statuses.map((item, idx) => {
          const s = statusBreakdown[item.st] || { count: 0, areaSqM: 0 };
          return (
            <div key={idx} className="bg-steel-50 p-2.5 rounded border border-steel-200 text-xs">
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="font-semibold text-steel-700">{item.label}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="font-bold text-steel-900">{s.areaSqM ? s.areaSqM.toFixed(1) : 0} m²</span>
                <span className="text-[11px] text-steel-500">{s.count} quotes</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusBreakdownView;
