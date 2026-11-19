import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  ShoppingBag, 
  Users, 
  ContactRound,
  Layers,
  ShoppingCart,
  Box,
  Menu,
  X
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'quotations', label: 'Quotations', icon: FileText },
  { id: 'sales', label: 'Sales Orders', icon: ShoppingBag },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'staff', label: 'Staff', icon: ContactRound },
  { id: 'products', label: 'Product SKUs', icon: Layers },
  { id: 'purchases', label: 'Purchases', icon: ShoppingCart },
];

const Sidebar = ({ activeTab, onSelectTab, mobileOpen = false, onCloseMobile }) => {
  const [collapsed, setCollapsed] = useState(true);

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
    <nav id={isMobile ? 'mobile-navigation' : 'desktop-navigation'} className="space-y-1" aria-label={isMobile ? 'Mobile Navigation' : 'Main Navigation'}>
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
            aria-current={isActive ? 'page' : undefined}
            title={!isMobile && collapsed ? item.label : undefined}
            className={`w-full flex items-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
              !isMobile && collapsed
                ? 'flex-col justify-center gap-1.5 px-1 py-3 text-[11px] leading-tight'
                : 'gap-2.5 px-3 py-2.5 text-xs'
            } ${
              isActive
                ? 'bg-slate-800 text-white font-semibold ring-1 ring-inset ring-teal-400/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span className={`flex shrink-0 items-center justify-center rounded-md ${!isMobile && collapsed ? 'h-8 w-8' : 'h-5 w-5'} ${isActive ? 'bg-teal-600 text-white' : 'bg-slate-800/70 text-slate-300'}`}>
              <Icon className="w-4 h-4" aria-hidden="true" />
            </span>
            <span className={!isMobile && collapsed ? 'text-center break-words w-full' : undefined}>{item.label}</span>
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
      <aside className={`app-sidebar hidden lg:flex ${collapsed ? 'w-24 px-2' : 'w-64 px-3'} bg-[#0f172a] text-slate-100 border-r border-slate-800 flex-col py-4 select-none shrink-0 sticky top-0 h-screen transition-[width] duration-200 motion-reduce:transition-none`}>
        <div className={`flex items-center mb-4 ${collapsed ? 'flex-col gap-3' : 'justify-between gap-2'}`}>
          <div className="flex items-center gap-2 text-white font-semibold">
            <Box className="w-6 h-6 text-teal-400 shrink-0" aria-hidden="true" />
            <span className={collapsed ? 'text-xs' : 'text-sm'}>{collapsed ? 'ERP' : 'GLASSERP'}</span>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-expanded={!collapsed}
            aria-controls="desktop-navigation"
            title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {renderNavLinks(false)}
        </div>
        <div className="mt-4 shrink-0">
          {collapsed ? (
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-teal-300" title="Plant status: Active">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" aria-hidden="true" />
              Active
            </div>
          ) : renderPlantStatus()}
        </div>
      </aside>

      {/* Mobile Drawer (Visible on < lg screens when toggled) */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        inert={mobileOpen ? undefined : ''}
        aria-hidden={!mobileOpen}
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
