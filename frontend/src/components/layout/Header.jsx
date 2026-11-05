import React, { useState, useEffect } from 'react';
import { Clock, Factory } from 'lucide-react';

export default function Header({ activeTab }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const titles = {
    dashboard: { title: 'Executive Overview', desc: 'Real-time production, active orders, and raw stock alerts' },
    quotations: { title: 'Quotation & Precision Billing', desc: 'Glass spec estimation, edge-work calculation, and customer quotes' },
    purchases: { title: 'Procurement & Raw Materials', desc: 'Float glass receipts, interlayer shipments, and supplier invoices' },
    inventory: { title: 'Warehouse Inventory & Racks', desc: 'Float sheet stock, cullet tracking, and storage A-frame mapping' },
    customers: { title: 'Client & Contractor Accounts', desc: 'Individual architects and commercial glazing organizations' },
  };

  const currentTab = titles[activeTab] || { title: 'VitroGlass Facility', desc: 'Glass Production Management' };

  return (
    <header className="h-20 border-b border-slate-200 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {currentTab.title}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">{currentTab.desc}</p>
      </div>

      <div className="flex items-center gap-6">
        {/* Plant shift indicator */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100/80 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700">
          <Factory className="w-3.5 h-3.5 text-sky-600" />
          <span className="font-semibold text-slate-800">Shift A</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500">Main Float Bay</span>
        </div>

        {/* Live clock */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-100/80 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700">
          <Clock className="w-3.5 h-3.5 text-sky-600" />
          <span className="font-mono text-slate-800 font-medium">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* System Health */}
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Online Synced</span>
        </div>
      </div>
    </header>
  );
}
