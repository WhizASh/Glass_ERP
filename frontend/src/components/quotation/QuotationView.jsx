import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, ArrowLeft } from 'lucide-react';
import CustomerSelector from './CustomerSelector';
import GlassItemCalculator from './GlassItemCalculator';
import QuotationSummary from './QuotationSummary';
import QuotationList from './QuotationList';
import QuotationDetailModal from './QuotationDetailModal';
import Button from '../common/Button';
import Card from '../common/Card';
import { api } from '../../services/api';

export default function QuotationView({ isCreatingNew, setIsCreatingNew, selectedQuoteForDetail, setSelectedQuoteForDetail }) {
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Quote form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [quoteItems, setQuoteItems] = useState([]);
  const [taxPercent, setTaxPercent] = useState(10);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [qData, cData] = await Promise.all([
        api.getQuotations(),
        api.getCustomers(),
      ]);
      setQuotations(qData || []);
      setCustomers(cData || []);
    } catch (err) {
      console.error('Error loading quotations data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddNewCustomer = async (custData) => {
    const created = await api.createCustomer(custData);
    if (created) {
      setCustomers((prev) => [...prev, created]);
    }
    return created;
  };

  const handleAddItem = (item) => {
    setQuoteItems((prev) => [...prev, item]);
  };

  const handleRemoveItem = (index) => {
    setQuoteItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const subtotal = quoteItems.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
  const taxAmount = (subtotal * Number(taxPercent || 0)) / 100;
  const totalAmount = Math.max(0, subtotal + taxAmount - Number(discount || 0));

  const handleSaveQuotation = async () => {
    if (!selectedCustomerId) {
      alert('Please select or register a customer for this quotation');
      return;
    }
    if (quoteItems.length === 0) {
      alert('Please calculate and add at least one glass line item to the quotation');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.createQuotation({
        customerId: selectedCustomerId,
        subtotal,
        taxAmount,
        discountAmount: Number(discount || 0),
        totalAmount,
        notes,
        status: 'DRAFT',
        items: quoteItems,
      });

      if (created) {
        // Reset form
        setQuoteItems([]);
        setSelectedCustomerId('');
        setNotes('');
        setDiscount(0);
        setIsCreatingNew(false);
        loadData();
      }
    } catch (err) {
      console.error('Failed to save quotation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    await api.updateQuotationStatus(id, status);
    loadData();
    if (selectedQuoteForDetail && selectedQuoteForDetail.id === id) {
      setSelectedQuoteForDetail((prev) => (prev ? { ...prev, status } : null));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">
            Precision Glass Estimations & Quotations
          </h2>
          <p className="text-xs text-slate-400">
            Formulate custom glass quotes by $m^2$, thickness, edge grinding/polishing, and CNC operations
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isCreatingNew ? (
            <Button
              variant="outline"
              size="sm"
              icon={ArrowLeft}
              onClick={() => setIsCreatingNew(false)}
            >
              Back to Quotations Register
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                onClick={loadData}
                isLoading={loading}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setIsCreatingNew(true)}
              >
                Create New Quotation
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main View: Creation Engine OR Quotation Register List */}
      {isCreatingNew ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card
              title="1. Customer & Glazing Site Details"
              subtitle="Link quotation to registered contractor or individual"
            >
              <CustomerSelector
                customers={customers}
                selectedCustomerId={selectedCustomerId}
                onSelectCustomer={setSelectedCustomerId}
                onAddNewCustomer={handleAddNewCustomer}
              />
            </Card>

            <Card
              title="2. Glass Specifications & Cutlist Calculator"
              subtitle="Dynamic pricing based on surface area (m²), edge polishing, and CNC hole milling"
            >
              <GlassItemCalculator
                items={quoteItems}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
              />
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="3. Financial & Billing Summary" subtitle="Taxes, discounts, and terms">
              <QuotationSummary
                subtotal={subtotal}
                taxPercent={taxPercent}
                onChangeTaxPercent={setTaxPercent}
                discount={discount}
                onChangeDiscount={setDiscount}
                notes={notes}
                onChangeNotes={setNotes}
              />

              <div className="pt-4 mt-4 border-t border-slate-800">
                <Button
                  variant="primary"
                  className="w-full"
                  size="lg"
                  disabled={quoteItems.length === 0 || !selectedCustomerId}
                  isLoading={isSubmitting}
                  onClick={handleSaveQuotation}
                >
                  Save & Issue Quotation
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <QuotationList
          quotations={quotations}
          onSelectQuote={(q) => setSelectedQuoteForDetail(q)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Full Detail & Printable Modal */}
      <QuotationDetailModal
        isOpen={Boolean(selectedQuoteForDetail)}
        onClose={() => setSelectedQuoteForDetail(null)}
        quotation={selectedQuoteForDetail}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
