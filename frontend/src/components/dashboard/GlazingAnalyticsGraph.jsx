import React, { useState } from 'react';
import { BarChart3, Layers, IndianRupee, PieChart, Sparkles } from 'lucide-react';
import StatusBreakdownView from './StatusBreakdownView';
import GlazingSvgChart from './GlazingSvgChart';

const GlazingAnalyticsGraph = ({ trendData = [], statusBreakdown = {}, kpis = {} }) => {
  const [metric, setMetric] = useState('area'); // 'area' | 'value' | 'breakdown'

  const data = trendData.length > 0 ? trendData : [
    { period: 'Jun', glazingArea: 40, acceptedArea: 25, quotationValue: 180000, acceptedValue: 120000, count: 4 },
    { period: 'Jul', glazingArea: 55, acceptedArea: 38, quotationValue: 240000, acceptedValue: 160000, count: 5 },
    { period: 'Aug', glazingArea: 68, acceptedArea: 45, quotationValue: 300000, acceptedValue: 200000, count: 6 },
    { period: 'Sep', glazingArea: 62, acceptedArea: 42, quotationValue: 280000, acceptedValue: 190000, count: 5 },
    { period: 'Oct', glazingArea: 85, acceptedArea: 60, quotationValue: 380000, acceptedValue: 260000, count: 8 },
    { period: 'Nov', glazingArea: 95, acceptedArea: 68, quotationValue: 420000, acceptedValue: 300000, count: 9 }
  ];

  const totalStatusArea = Object.values(statusBreakdown).reduce((acc, s) => acc + (s.areaSqM || 0), 0) || 1;
  const acceptedArea = statusBreakdown.ACCEPTED?.areaSqM || 0;
  const winRate = ((acceptedArea / totalStatusArea) * 100).toFixed(0);

  return (
    <div className="bg-white rounded-lg border border-steel-200 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header & Metric Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-steel-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-teal-50 border border-teal-200 text-teal-700">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-steel-900 uppercase tracking-wider">
              Glazing Takeoff & Fabrication Trends
            </h3>
            <p className="text-[11px] text-steel-500">
              Quoted glass area (m²), win velocity, and active pipeline
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-0.5 bg-steel-100 rounded-md border border-steel-200 text-xs">
          <button
            onClick={() => setMetric('area')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
              metric === 'area' ? 'filter-pill-active bg-slate-900 text-white' : 'filter-pill-inactive text-steel-600'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Glazing Area (m²)</span>
          </button>
          <button
            onClick={() => setMetric('value')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
              metric === 'value' ? 'filter-pill-active bg-slate-900 text-white' : 'filter-pill-inactive text-steel-600'
            }`}
          >
            <IndianRupee className="w-3 h-3" />
            <span>Pipeline (₹)</span>
          </button>
          <button
            onClick={() => setMetric('breakdown')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
              metric === 'breakdown' ? 'filter-pill-active bg-slate-900 text-white' : 'filter-pill-inactive text-steel-600'
            }`}
          >
            <PieChart className="w-3 h-3" />
            <span>Status Share</span>
          </button>
        </div>
      </div>

      {/* Main Graph or Breakdown */}
      {metric === 'breakdown' ? (
        <StatusBreakdownView
          statusBreakdown={statusBreakdown}
          totalStatusArea={totalStatusArea}
          winRate={winRate}
        />
      ) : (
        <GlazingSvgChart data={data} metric={metric} />
      )}

      {/* Bottom Architectural Legend Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-steel-100 text-xs">
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-teal-600 inline-block" />
            <span className="text-steel-600 font-medium">Total Quoted Volume</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
            <span className="text-steel-600 font-medium">Accepted for Cutting / Tempering</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-steel-500 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Active Glazing Pipeline: <strong className="text-steel-800">{kpis.totalGlazingArea || 0} m²</strong></span>
        </div>
      </div>
    </div>
  );
};

export default GlazingAnalyticsGraph;
