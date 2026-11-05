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
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand logo & title */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-cyan-950/50">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-100 tracking-tight text-base">VitroGlass</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-800/60">
              ERP
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Precision Glass Facility</p>
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
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
                  ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
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
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-medium text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Plant Line 1
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800/40">
              Operational
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Temper Furnace: 685°C</p>
          <p className="text-[11px] text-slate-400">Cutting Bed: CNC Auto-Load</p>
        </div>
      </div>
    </aside>
  );
}
