import React from 'react';
import { Building2 } from 'lucide-react';

const Header = ({ activeTabTitle }) => {
  const companyName = import.meta.env.VITE_COMPANY_NAME || 'ClearView Glass Solutions';

  return (
    <header className="glass-header sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
      {/* Company Branding */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-tr from-blue-600 to-sky-500 rounded-xl shadow-sm text-white flex items-center justify-center">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">
            {companyName}
          </h1>
          <p className="text-xs text-blue-600 font-medium tracking-wide uppercase">
            Glass ERP Suite
          </p>
        </div>
      </div>

      {/* Current Active Section Badge */}
      <div className="flex items-center">
        <div className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
          {activeTabTitle}
        </div>
      </div>
    </header>
  );
};

export default Header;
