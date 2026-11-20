import React, { useEffect, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import DashboardKpis from '../dashboard/DashboardKpis';
import GlazingAnalyticsGraph from '../dashboard/GlazingAnalyticsGraph';
import RecentActivityGrid from '../dashboard/RecentActivityGrid';
import { api } from '../../services/api';

const DashboardView = ({ onNavigateTab }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    api.getDashboardStats()
      .then((data) => {
        if (!mounted) return;
        if (!data?.kpis) throw new Error('Dashboard returned no metrics.');
        setStats({
          kpis: data.kpis || {},
          statusBreakdown: data.statusBreakdown || {},
          trendData: data.trendData || [],
          recentQuotations: data.recentQuotations || [],
          recentSales: data.recentSales || []
        });
      })
      .catch((err) => {
        if (mounted) setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [attempt]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Welcome / Overview Bar */}
      <div className="bg-white rounded-lg border border-steel-200 p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-steel-900 tracking-tight">
            Architectural Glazing Operations Overview
          </h2>
          <p className="text-xs text-steel-500 mt-0.5">
            Real-time status of glass takeoff quotes, fabrication orders, and glazing specs.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onNavigateTab('quotations')}
            className="btn-primary inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-md text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors flex-1 sm:flex-initial"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Quotation</span>
          </button>
          <button
            onClick={() => onNavigateTab('customers')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-md text-xs font-semibold bg-white text-steel-700 border border-steel-300 hover:bg-steel-50 transition-colors flex-1 sm:flex-initial"
          >
            <Users className="w-3.5 h-3.5 text-steel-500" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div role="status" aria-busy="true" aria-label="Loading dashboard" className="space-y-4">
          <p className="text-sm text-steel-600">Loading dashboard…</p>
          <div aria-hidden="true" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((key) => (
              <div key={key} className="h-32 rounded-lg border border-steel-200 bg-white motion-safe:animate-pulse" />
            ))}
          </div>
          <div aria-hidden="true" className="h-64 rounded-lg border border-steel-200 bg-white motion-safe:animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-steel-200 bg-white p-5">
          <p role="alert" className="text-sm text-red-700">Could not load dashboard. {error}</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)}
            className="mt-3 min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-600">
            Retry dashboard
          </button>
        </div>
      ) : stats && (
        <>
          <DashboardKpis kpis={stats.kpis} />
          <GlazingAnalyticsGraph trendData={stats.trendData} statusBreakdown={stats.statusBreakdown} kpis={stats.kpis} />
          <RecentActivityGrid recentQuotations={stats.recentQuotations} recentSales={stats.recentSales} onNavigateTab={onNavigateTab} />
        </>
      )}
    </div>
  );
};

export default DashboardView;
