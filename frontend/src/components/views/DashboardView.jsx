import React, { useEffect, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import DashboardKpis from '../dashboard/DashboardKpis';
import GlazingAnalyticsGraph from '../dashboard/GlazingAnalyticsGraph';
import RecentActivityGrid from '../dashboard/RecentActivityGrid';
import { api } from '../../services/api';

const DashboardView = ({ onNavigateTab }) => {
  const [stats, setStats] = useState({
    kpis: {
      totalGlazingArea: 0,
      inReviewQuotes: 0,
      acceptedQuotes: 0,
      draftQuotes: 0,
      totalPipelineValue: 0,
      totalQuotations: 0,
      activeQuotes: 0,
      totalSales: 0,
      pendingOrders: 0,
      totalCustomers: 0,
      totalProductSkus: 0
    },
    statusBreakdown: {},
    trendData: [],
    recentQuotations: [],
    recentSales: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    api.getDashboardStats()
      .then((data) => {
        if (!mounted || !data) return;
        setStats({
          kpis: data.kpis || {},
          statusBreakdown: data.statusBreakdown || {},
          trendData: data.trendData || [],
          recentQuotations: data.recentQuotations || [],
          recentSales: data.recentSales || []
        });
      })
      .catch((err) => {
        console.warn('Dashboard stats notice:', err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Welcome / Overview Bar */}
      <div className="bg-white rounded-lg border border-steel-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-steel-900 tracking-tight">
            Architectural Glazing Operations Overview
          </h2>
          <p className="text-xs text-steel-500 mt-0.5">
            Real-time status of glass takeoff quotes, fabrication orders, and glazing specs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('quotations')}
            className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Quotation</span>
          </button>
          <button
            onClick={() => onNavigateTab('customers')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white text-steel-700 border border-steel-300 hover:bg-steel-50 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-steel-500" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* High-Impact Glazing & Operations KPI Cards */}
      <DashboardKpis kpis={stats.kpis} />

      {/* Architectural Glazing Trend & Status Graph */}
      <GlazingAnalyticsGraph
        trendData={stats.trendData}
        statusBreakdown={stats.statusBreakdown}
        kpis={stats.kpis}
      />

      {/* Recent Activity Sections */}
      <RecentActivityGrid
        recentQuotations={stats.recentQuotations}
        recentSales={stats.recentSales}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
};

export default DashboardView;
