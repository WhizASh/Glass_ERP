import React, { useState, useEffect } from 'react';
import MetricCards from './MetricCards';
import QuickLinks from './QuickLinks';
import SalesChart from './SalesChart';
import TopProduceWidget from './TopProduceWidget';
import RecentSalesTable from './RecentSalesTable';
import RecentPurchasesFeed from './RecentPurchasesFeed';
import { api } from '../../services/api';

export default function DashboardView({
  onNavigate,
  onOpenNewQuotation,
  onOpenNewPurchase,
  onOpenNewInventory,
  onOpenNewCustomer,
  onSelectQuote,
}) {
  const [summary, setSummary] = useState({});
  const [topProduce, setTopProduce] = useState([]);
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [sum, top, act] = await Promise.all([
        api.getDashboardSummary(),
        api.getTopProduce(),
        api.getRecentActivity(),
      ]);
      setSummary(sum?.data || sum || {});
      setTopProduce(Array.isArray(top) ? top : top?.data || []);
      const activityData = act?.data || act || {};
      setRecentQuotes(activityData.recentSales || activityData.recentQuotations || []);
      setRecentPurchases(activityData.recentPurchases || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Quick Links Bar */}
      <QuickLinks
        onNewQuotation={onOpenNewQuotation}
        onNewPurchase={onOpenNewPurchase}
        onNewInventory={onOpenNewInventory}
        onNewCustomer={onOpenNewCustomer}
      />

      {/* KPI Highlight Cards */}
      <MetricCards summary={summary} onNavigate={onNavigate} />

      {/* Charts & Top Produce Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart fetchSalesChart={api.getSalesChart} />
        </div>
        <div>
          <TopProduceWidget topProduce={topProduce} />
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentSalesTable
          quotations={recentQuotes}
          onSelectQuote={onSelectQuote}
          onViewAll={() => onNavigate('quotations')}
        />
        <RecentPurchasesFeed
          purchases={recentPurchases}
          onViewAll={() => onNavigate('purchases')}
        />
      </div>
    </div>
  );
}
