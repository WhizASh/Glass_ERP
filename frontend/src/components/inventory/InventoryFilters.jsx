import React from 'react';
import { Search } from 'lucide-react';
import Input from '../common/Input';

export const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Inventory' },
  { id: 'FLOAT_SHEET', label: 'Float Sheets' },
  { id: 'RAW_MATERIAL', label: 'Raw Interlayers' },
  { id: 'FINISHED_GLASS', label: 'Finished Stock' },
  { id: 'HARDWARE_FITTINGS', label: 'Hardware' },
  { id: 'CONSUMABLE', label: 'Consumables' },
];

export default function InventoryFilters({
  activeCategory,
  onSelectCategory,
  searchTerm,
  onChangeSearch,
}) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs w-full md:w-auto">
        {CATEGORY_TABS.map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectCategory(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="w-full md:w-72">
        <Input
          icon={Search}
          placeholder="Filter SKU, glass type or rack..."
          value={searchTerm}
          onChange={(e) => onChangeSearch(e.target.value)}
        />
      </div>
    </div>
  );
}
