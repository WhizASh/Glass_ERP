import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ activeTab, onSelectTab, children }) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar activeTab={activeTab} onSelectTab={onSelectTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header activeTab={activeTab} />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
