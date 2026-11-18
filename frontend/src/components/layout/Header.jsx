import React from 'react';
import { Building2, Compass, Menu, X } from 'lucide-react';

const Header = ({ activeTabTitle, onToggleMobileMenu, mobileMenuOpen }) => {
  const companyName = import.meta.env.VITE_COMPANY_NAME || 'Bharat Glass Solutions India';

  return (
    <header className="bg-slate-900 border-b border-slate-900 sticky top-0 z-30 px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2 select-none">
      {/* Mobile Menu Toggle + Company Branding */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 -ml-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-edge-600 transition-colors shrink-0"
          aria-label={mobileMenuOpen ? 'Close navigation drawer' : 'Open navigation menu'}
          aria-expanded={Boolean(mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5 text-slate-100" /> : <Menu className="w-5 h-5 text-slate-100" />}
        </button>

        <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 text-slate-100 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-teal-300" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight truncate max-w-[170px] xs:max-w-[220px] sm:max-w-none">
            {companyName}
          </h1>
          <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono tracking-wider uppercase truncate">
            Commercial Glass &amp; Glazing ERP
          </p>
        </div>
      </div>

      {/* Current Active Section Badge */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-mono text-slate-300 bg-slate-800 px-2 sm:px-2.5 py-1 rounded border border-slate-700">
          <Compass className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-300 shrink-0" />
          <span className="hidden sm:inline">MODULE:</span>
          <span className="font-bold text-slate-100 truncate max-w-[110px] sm:max-w-none">{activeTabTitle}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
