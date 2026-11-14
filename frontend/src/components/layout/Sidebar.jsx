import React, { useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  ShoppingBag, 
  Users, 
  Layers,
  Box,
  X
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'quotations', label: 'Quotations', icon: FileText },
  { id: 'sales', label: 'Sales Orders', icon: ShoppingBag },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'products', label: 'Product SKUs', icon: Layers },
];

const Sidebar = ({ activeTab, onSelectTab, mobileOpen = false, onCloseMobile }) => {
  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const renderNavLinks = (isMobile = false) => (
    <nav className="space-y-1" aria-label={isMobile ? 'Mobile Navigation' : 'Main Navigation'}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onSelectTab(item.id);
              if (isMobile && onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
              isActive
                ? 'bg-slate-800 text-white font-semibold border-l-2 border-teal-400 pl-[10px]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  const renderBrand = (isMobile = false) => (
    <div className="flex items-center justify-between px-2 mb-6">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-md bg-teal-600 border border-teal-500/40 flex items-center justify-center text-white shadow-xs shrink-0">
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
      {isMobile && onCloseMobile && (
        <button
          type="button"
          onClick={onCloseMobile}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close navigation"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  const renderPlantStatus = () => (
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
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="app-sidebar hidden lg:flex w-64 min-h-screen bg-[#0f172a] text-slate-100 border-r border-slate-800 flex-col justify-between py-5 px-3 select-none shrink-0 sticky top-0 h-screen">
        <div>
          {renderBrand(false)}
          {renderNavLinks(false)}
        </div>
        {renderPlantStatus()}
      </aside>

      {/* Mobile Drawer (Visible on < lg screens when toggled) */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Drawer"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />

        {/* Slide-out Drawer Panel */}
        <div
          className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#0f172a] text-slate-100 border-r border-slate-800 flex flex-col justify-between p-4 shadow-2xl transition-transform duration-300 ease-in-out transform ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div>
            {renderBrand(true)}
            {renderNavLinks(true)}
          </div>
          {renderPlantStatus()}
        </div>
      </div>
    </>
  );
};

export default Sidebar;