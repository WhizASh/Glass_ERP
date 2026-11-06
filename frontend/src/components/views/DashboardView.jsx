import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  ShoppingBag, 
  Users, 
  Layers, 
  Plus, 
  ArrowUpRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import StatCard from '../common/StatCard';
import StatusBadge from '../common/StatusBadge';
import { api } from '../../services/api';

const DashboardView = ({ onNavigateTab, onOpenModal }) => {
  const [stats, setStats] = useState({
    kpis: {
      totalQuotations: 0,
      activeQuotes: 0,
      totalSales: 0,
      pendingOrders: 0,
      totalCustomers: 0,
      totalProductSkus: 0
    },
    recentQuotations: [],
    recentSales: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.getDashboardStats()
      .then((data) => {
        if (mounted && data) {
          setStats(data);
        }
      })
      .catch((err) => {
        console.warn('Dashboard stats notice (starting clean):', err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome / Overview Bar */}
      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Glass Operations Overview
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time status of quotations, sales orders, clients, and glass catalog specifications.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('quotations')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </button>
          <button
            onClick={() => onNavigateTab('customers')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold glass-button text-slate-700 shadow-xs"
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Quotations"
          value={stats.kpis.totalQuotations}
          icon={FileText}
          description={`${stats.kpis.activeQuotes || 0} active in pipeline`}
        />
        <StatCard
          title="Sales Orders"
          value={stats.kpis.totalSales}
          icon={ShoppingBag}
          description={`${stats.kpis.pendingOrders || 0} pending processing`}
        />
        <StatCard
          title="Total Customers"
          value={stats.kpis.totalCustomers}
          icon={Users}
          description="Organizations & Individuals"
        />
        <StatCard
          title="Product SKUs"
          value={stats.kpis.totalProductSkus}
          icon={Layers}
          description="Active glass specifications"
        />
      </div>

      {/* Recent Activity Sections (Clean Empty States) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotations */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200/80">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Recent Quotations
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('quotations')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4">
            {stats.recentQuotations && stats.recentQuotations.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {stats.recentQuotations.map((quote) => (
                  <div key={quote.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{quote.quoteNumber}</p>
                      <p className="text-xs text-slate-400">{quote.customer?.companyName || quote.customer?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">${Number(quote.totalAmount).toFixed(2)}</p>
                      <StatusBadge status={quote.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-sm font-medium text-slate-600">No quotations generated yet</p>
                <p className="text-xs text-slate-400 mt-1">Quotations created in the Quotations tab will appear here.</p>
                <button
                  onClick={() => onNavigateTab('quotations')}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create first quote</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Sales Orders */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200/80">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Recent Sales Orders
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('sales')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4">
            {stats.recentSales && stats.recentSales.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {stats.recentSales.map((order) => (
                  <div key={order.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{order.orderNumber}</p>
                      <p className="text-xs text-slate-400">{order.customer?.companyName || order.customer?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">${Number(order.totalAmount).toFixed(2)}</p>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-sm font-medium text-slate-600">No sales orders registered yet</p>
                <p className="text-xs text-slate-400 mt-1">Sales converted or created will appear in this list.</p>
                <button
                  onClick={() => onNavigateTab('sales')}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create sale order</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
