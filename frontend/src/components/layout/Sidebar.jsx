import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  ShoppingBag, 
  Users, 
  Layers,
  Sparkles
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
    <aside className="glass-sidebar w-64 min-h-screen flex flex-col justify-between py-6 px-4">
      <div>
        {/* Logo / App identifier */}
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold bg-gradient-to-r from-blue-700 to-sky-600 bg-clip-text text-transparent">
              GLASSERP
            </span>
            <span className="block text-[11px] font-medium text-slate-400">
              Enterprise v1.0
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-semibold'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/60 text-xs text-slate-500">
        <p className="font-semibold text-blue-900">Sprint 1 Scaffolding</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Glass Fabrication & Sales</p>
      </div>
    </aside>
  );
};

export default Sidebar;
