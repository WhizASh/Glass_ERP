import React from 'react';
import { Building2, Compass } from 'lucide-react';

const Header = ({ activeTabTitle }) => {
  const companyName = import.meta.env.VITE_COMPANY_NAME || 'Bharat Glass Solutions India';

  return (
    <header className="bg-white border-b border-steel-200 sticky top-0 z-30 px-5 py-3 flex items-center justify-between">
      {/* Company Branding */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded bg-steel-100 border border-steel-300 text-steel-800 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-edge-700" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-steel-900 tracking-tight leading-none">
            {companyName}
          </h1>
          <p className="text-[10px] text-steel-500 font-mono tracking-wider uppercase mt-0.5">
            Commercial Glass & Glazing ERP
          </p>
        </div>
      </div>

      {/* Current Active Section Badge */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-steel-500 bg-steel-50 px-2.5 py-1 rounded border border-steel-200">
          <Compass className="w-3.5 h-3.5 text-edge-600" />
          <span>MODULE:</span>
          <span className="font-bold text-steel-800">{activeTabTitle}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
