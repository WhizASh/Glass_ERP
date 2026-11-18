import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DashboardView from './components/views/DashboardView';
import QuotationsView from './components/views/QuotationsView';
import SalesView from './components/views/SalesView';
import CustomersView from './components/views/CustomersView';
import ProductSKUsView from './components/views/ProductSKUsView';
import PurchasesView from './components/views/PurchasesView';

const tabTitles = {
  dashboard: 'Operations Dashboard',
  quotations: 'Glass Quotations & Takeoff',
  sales: 'Sales Orders',
  customers: 'Customer & Contractor Directory',
  products: 'Glass Product SKU Catalog',
  purchases: 'Purchases'
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigateTab={handleSelectTab} />;
      case 'quotations':
        return <QuotationsView />;
      case 'sales':
        return <SalesView />;
      case 'customers':
        return <CustomersView />;
      case 'products':
        return <ProductSKUsView />;
      case 'purchases':
        return <PurchasesView />;
      default:
        return <DashboardView onNavigateTab={handleSelectTab} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-steel-900 font-sans antialiased">
      {/* Structural Framing Sidebar (Desktop + Mobile Responsive Drawer) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTabTitle={tabTitles[activeTab]}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          mobileMenuOpen={mobileMenuOpen}
        />

        <main className="flex-1 min-w-0 bg-[#f1f5f9] rounded-tl-3xl">
          <div className="p-3 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto min-w-0">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
