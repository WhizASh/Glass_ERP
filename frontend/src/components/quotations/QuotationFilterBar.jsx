import React from 'react';
import { Search, Plus, Filter } from 'lucide-react';

const STATUS_OPTIONS = ['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'CANCELLED'];

const QuotationFilterBar = ({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  statusCounts = {},
  onOpenCreateModal
}) => {
  return (
    <div className="bg-white p-3 rounded-lg border border-steel-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Search Input & Status Buttons */}
      <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-2.5">
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-steel-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            placeholder="Search Quote #, Client, Company..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-steel-50 border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-steel-400 shrink-0 ml-1" />
          {STATUS_OPTIONS.map((status) => {
            const count = statusCounts[status];
            const isActive = selectedStatus === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => onStatusChange(status)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'filter-pill-active bg-slate-900 text-white font-semibold shadow-xs'
                    : 'filter-pill-inactive text-slate-600 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                <span>{status === 'ALL' ? 'All Quotes' : status}</span>
                {count !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Action */}
      <button
        type="button"
        onClick={onOpenCreateModal}
        className="btn-primary inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-xs transition-colors shrink-0"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>New Quotation</span>
      </button>
    </div>
  );
};

export default QuotationFilterBar;
