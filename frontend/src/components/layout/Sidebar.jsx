import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  ShoppingBag, 
  Users, 
  Layers,
  Box
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'quotations', label: 'Quotations', icon: FileText },
  { id: 'sales', label: 'Sales Orders', icon: ShoppingBag },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'products', label: 'Product SKUs', icon: Layers },
];

const Sidebar = ({ activeTab, onSelectTab }) => {
  return (
    <aside className="app-sidebar w-64 min-h-screen bg-[#0f172a] text-slate-100 border-r border-slate-800 flex flex-col justify-between py-5 px-3 select-none shrink-0">
      <div>
        {/* Brand & Glass Fabrication Identifier */}
        <div className="flex items-center gap-3 px-3 mb-7">
          <div className="w-8 h-8 rounded-md bg-teal-600 border border-teal-500/40 flex items-center justify-center text-white shadow-xs">
            <Box className="w-4 h-4 text-teal-100" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>GLASSERP</span>
              <span className="text-[10px] font-mono px-1 py-0.2 bg-teal-950 text-teal-300 rounded border border-teal-800">
                FAB
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Architectural Glazing
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold border-l-2 border-teal-400 pl-[10px]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Operational Status */}
      <div className="p-3 bg-slate-950/90 rounded-md border border-slate-800 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center justify-between text-slate-300 font-medium">
          <span>Plant Status</span>
          <span className="flex items-center gap-1 text-teal-400 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
            ACTIVE
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          Precision Millimeter Takeoff
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
