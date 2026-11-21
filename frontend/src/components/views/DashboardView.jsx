import PageLayout, { PageError } from '../common/PageLayout';
import { primary, secondary } from '../common/ui';
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
    <PageLayout title="Dashboard" description="Quotations, production orders and business activity." actions={<><button type="button" onClick={() => onNavigateTab('customers')} className={secondary}><Users className="h-4 w-4" aria-hidden="true" />Add customer</button><button type="button" onClick={() => onNavigateTab('quotations')} className={primary}><Plus className="h-4 w-4" aria-hidden="true" />New quotation</button></>}>
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
        <PageError message={`Could not load dashboard. ${error}`} onRetry={() => setAttempt(value => value + 1)} />
      ) : stats && (
        <>
          <DashboardKpis kpis={stats.kpis} />
          <GlazingAnalyticsGraph trendData={stats.trendData} statusBreakdown={stats.statusBreakdown} kpis={stats.kpis} />
          <RecentActivityGrid recentQuotations={stats.recentQuotations} recentSales={stats.recentSales} onNavigateTab={onNavigateTab} />
        </>
      )}
    </PageLayout>
  );
};

export default DashboardView;
