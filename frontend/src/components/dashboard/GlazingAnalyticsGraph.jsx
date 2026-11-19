import React, { useState } from 'react';
import { LineChart, Layers, IndianRupee, PieChart, Sparkles } from 'lucide-react';
import StatusBreakdownView from './StatusBreakdownView';
import GlazingSvgChart from './GlazingSvgChart';

const GlazingAnalyticsGraph = ({ trendData = [], statusBreakdown = {}, kpis = {} }) => {
  const [metric, setMetric] = useState('area'); // 'area' | 'value' | 'breakdown'

  const data = trendData;

  const totalStatusArea = Object.values(statusBreakdown).reduce((acc, s) => acc + (s.areaSqM || 0), 0) || 1;
  const acceptedArea = statusBreakdown.ACCEPTED?.areaSqM || 0;
  const winRate = ((acceptedArea / totalStatusArea) * 100).toFixed(0);

  return (
    <div className="bg-white rounded-lg border border-steel-200 p-3.5 sm:p-5 shadow-xs space-y-4">
      {/* Header & Metric Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-steel-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-teal-50 border border-teal-200 text-teal-700 shrink-0">
            <LineChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-steel-900 uppercase tracking-wider">
              Glazing Takeoff &amp; Fabrication Trends
            </h3>
            <p className="text-[11px] text-steel-500">
              Quoted glass area (m²), win velocity, and active pipeline
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-0.5 bg-steel-100 rounded-md border border-steel-200 text-xs w-full sm:w-auto overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setMetric('area')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-colors ${
              metric === 'area' ? 'filter-pill-active bg-slate-900 text-white' : 'filter-pill-inactive text-steel-600'
            }`}
          >
            <Layers className="w-3 h-3 shrink-0" />
            <span>Glazing Area (m²)</span>
          </button>
          <button
            type="button"
            onClick={() => setMetric('value')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-colors ${
              metric === 'value' ? 'filter-pill-active bg-slate-900 text-white' : 'filter-pill-inactive text-steel-600'
            }`}
          >
            <IndianRupee className="w-3 h-3 shrink-0" />
            <span>Pipeline (₹)</span>
          </button>
          <button
            type="button"
            onClick={() => setMetric('breakdown')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-colors ${
              metric === 'breakdown' ? 'filter-pill-active bg-slate-900 text-white' : 'filter-pill-inactive text-steel-600'
            }`}
          >
            <PieChart className="w-3 h-3 shrink-0" />
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
      ) : data.length ? (
        <GlazingSvgChart data={data} metric={metric} />
      ) : (
        <p className="py-12 text-center text-sm text-steel-600">No trend data available.</p>
      )}

      {/* Bottom Architectural Legend Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-steel-100 text-xs">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-0 border-t-2 border-teal-600 inline-block shrink-0" />
            <span className="text-steel-600 font-medium">Total Quoted Volume</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-0 border-t-2 border-dashed border-emerald-500 inline-block shrink-0" />
            <span className="text-steel-600 font-medium">Accepted for Cutting</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-steel-500 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>Active Glazing Pipeline: <strong className="text-steel-800">{kpis.totalGlazingArea || 0} m²</strong></span>
        </div>
      </div>
    </div>
  );
};

export default GlazingAnalyticsGraph;
