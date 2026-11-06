import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DashboardView from './components/views/DashboardView';
import QuotationsView from './components/views/QuotationsView';
import SalesView from './components/views/SalesView';
import CustomersView from './components/views/CustomersView';
import ProductSKUsView from './components/views/ProductSKUsView';

const tabTitles = {
  dashboard: 'Operations Dashboard',
  quotations: 'Glass Quotations Management',
  sales: 'Sales Orders & Fulfillment',
  customers: 'Customer Directory',
  products: 'Product SKU Catalog'
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigateTab={setActiveTab} />;
      case 'quotations':
        return <QuotationsView />;
      case 'sales':
        return <SalesView />;
      case 'customers':
        return <CustomersView />;
      case 'products':
        return <ProductSKUsView />;
      default:
        return <DashboardView onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Light Glass Sidebar */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header activeTabTitle={tabTitles[activeTab]} />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default App;
