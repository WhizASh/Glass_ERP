import React, { useState } from 'react';
import Layout from './components/layout/Layout';
import DashboardView from './components/dashboard/DashboardView';
import QuotationView from './components/quotation/QuotationView';
import PurchaseView from './components/purchase/PurchaseView';
import InventoryView from './components/inventory/InventoryView';
import CustomerView from './components/customers/CustomerView';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Lifted modal/creation triggers for seamless QuickLinks interactions
  const [isQuotationCreateOpen, setIsQuotationCreateOpen] = useState(false);
  const [selectedQuoteForDetail, setSelectedQuoteForDetail] = useState(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isInventoryAddModalOpen, setIsInventoryAddModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Quick Action Handlers from Dashboard
  const handleQuickNewQuotation = () => {
    setActiveTab('quotations');
    setIsQuotationCreateOpen(true);
  };

  const handleQuickNewPurchase = () => {
    setActiveTab('purchases');
    setIsPurchaseModalOpen(true);
  };

  const handleQuickNewInventory = () => {
    setActiveTab('inventory');
    setIsInventoryAddModalOpen(true);
  };

  const handleQuickNewCustomer = () => {
    setActiveTab('customers');
    setIsCustomerModalOpen(true);
  };

  const handleSelectQuoteFromDashboard = (quote) => {
    setActiveTab('quotations');
    setIsQuotationCreateOpen(false);
    setSelectedQuoteForDetail(quote);
  };

  return (
    <Layout activeTab={activeTab} onSelectTab={setActiveTab}>
      {activeTab === 'dashboard' && (
        <DashboardView
          onNavigate={setActiveTab}
          onOpenNewQuotation={handleQuickNewQuotation}
          onOpenNewPurchase={handleQuickNewPurchase}
          onOpenNewInventory={handleQuickNewInventory}
          onOpenNewCustomer={handleQuickNewCustomer}
          onSelectQuote={handleSelectQuoteFromDashboard}
        />
      )}

      {activeTab === 'quotations' && (
        <QuotationView
          isCreatingNew={isQuotationCreateOpen}
          setIsCreatingNew={setIsQuotationCreateOpen}
          selectedQuoteForDetail={selectedQuoteForDetail}
          setSelectedQuoteForDetail={setSelectedQuoteForDetail}
        />
      )}

      {activeTab === 'purchases' && (
        <PurchaseView
          isNewModalOpen={isPurchaseModalOpen}
          setIsNewModalOpen={setIsPurchaseModalOpen}
        />
      )}

      {activeTab === 'inventory' && (
        <InventoryView
          isAddModalOpen={isInventoryAddModalOpen}
          setIsAddModalOpen={setIsInventoryAddModalOpen}
        />
      )}

      {activeTab === 'customers' && (
        <CustomerView
          isAddModalOpen={isCustomerModalOpen}
          setIsAddModalOpen={setIsCustomerModalOpen}
        />
      )}
    </Layout>
  );
}
