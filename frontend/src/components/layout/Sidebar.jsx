import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  ShoppingBag,
  Boxes,
  Users,
  Layers,
  Sparkles,
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'quotations', label: 'Quotations & Billing', icon: FileSpreadsheet },
  { id: 'purchases', label: 'Purchase Orders', icon: ShoppingBag },
  { id: 'inventory', label: 'Inventory & Stock', icon: Boxes },
  { id: 'customers', label: 'Customer Directory', icon: Users },
];

export default function Sidebar({ activeTab, onSelectTab }) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-30 select-none shadow-xs">
      {/* Brand logo & title */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-200 bg-slate-50/50">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 tracking-tight text-base">VitroGlass</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-200">
              ERP
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Precision Glass Facility</p>
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Operations Hub
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md shadow-sky-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Facility Status / Shift Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/60">
        <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Plant Line 1
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
              Operational
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Temper Furnace: 685°C</p>
          <p className="text-[11px] text-slate-500">Cutting Bed: CNC Auto-Load</p>
        </div>
      </div>
    </aside>
  );
}
