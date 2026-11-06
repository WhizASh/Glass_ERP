import React from 'react';
import { Clock, TrendingUp, ArrowUpRight, FileText } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const RecentActivityGrid = ({ recentQuotations = [], recentSales = [], onNavigateTab }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Recent Glass Quotations */}
      <div className="bg-white rounded-lg border border-steel-200 p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-steel-200">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-700" />
            <h3 className="text-xs font-bold text-steel-900 uppercase tracking-wider">
              Recent Glass Quotations
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('quotations')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-0.5"
          >
            <span>View all</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="mt-3">
          {recentQuotations && recentQuotations.length > 0 ? (
            <div className="divide-y divide-steel-100">
              {recentQuotations.map((quote) => (
                <div key={quote.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-mono font-bold text-steel-900">{quote.quoteNumber}</p>
                    <p className="text-[11px] text-steel-500">{quote.customer?.companyName || quote.customer?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-steel-900">₹{Number(quote.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <StatusBadge status={quote.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs">
              <FileText className="w-6 h-6 text-steel-300 mx-auto mb-1.5" />
              <p className="font-medium text-steel-700">No quotations logged yet</p>
              <p className="text-[11px] text-steel-400 mt-0.5">Takeoffs drafted in the builder will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Production Orders */}
      <div className="bg-white rounded-lg border border-steel-200 p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-steel-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-steel-700" />
            <h3 className="text-xs font-bold text-steel-900 uppercase tracking-wider">
              Recent Production Orders
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('sales')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-0.5"
          >
            <span>View all</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="mt-3">
          {recentSales && recentSales.length > 0 ? (
            <div className="divide-y divide-steel-100">
              {recentSales.map((order) => (
                <div key={order.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-mono font-bold text-steel-900">{order.orderNumber}</p>
                    <p className="text-[11px] text-steel-500">{order.customer?.companyName || order.customer?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-steel-900">₹{Number(order.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs">
              <TrendingUp className="w-6 h-6 text-steel-300 mx-auto mb-1.5" />
              <p className="font-medium text-steel-700">No production orders yet</p>
              <p className="text-[11px] text-steel-400 mt-0.5">Accepted quotations convert directly to orders.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentActivityGrid;
