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

  // Quote form & edit state
  const [editingQuote, setEditingQuote] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [quoteItems, setQuoteItems] = useState([]);
  const [taxPercent, setTaxPercent] = useState(18);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setQuoteItems([]);
    setSelectedCustomerId('');
    setNotes('');
    setDiscount(0);
    setTaxPercent(18);
    setEditingQuote(null);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [qData, cData] = await Promise.all([api.getQuotations(), api.getCustomers()]);
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
    if (created) setCustomers((prev) => [...prev, created]);
    return created;
  };

  const handleAddItem = (item) => setQuoteItems((prev) => [...prev, item]);
  const handleRemoveItem = (index) => setQuoteItems((prev) => prev.filter((_, idx) => idx !== index));
  const handleUpdateItem = (index, item) => setQuoteItems((prev) => prev.map((it, idx) => (idx === index ? item : it)));

  const handleEditQuote = (quote) => {
    setEditingQuote(quote);
    setSelectedCustomerId(quote.customerId || '');
    setQuoteItems((quote.items || []).map((it, idx) => ({
      id: it.id || `item-${Date.now()}-${idx}`,
      glassType: it.glassType,
      thicknessMm: Number(it.thicknessMm) || 6,
      widthMm: Number(it.widthMm) || 1000,
      heightMm: Number(it.heightMm) || 1000,
      areaSqM: Number(it.areaSqM) || (Number(it.widthMm) * Number(it.heightMm)) / 1000000,
      perimeterM: (2 * (Number(it.widthMm) + Number(it.heightMm))) / 1000,
      quantity: Number(it.quantity) || 1,
      edgeWork: it.edgeWork || 'CLEAN_CUT',
      holesCount: Number(it.holesCount) || 0,
      unitPrice: Number(it.unitPrice) || 0,
      lineTotal: Number(it.lineTotal) || 0,
    })));
    const taxPct = quote.subtotal > 0 ? Math.round((Number(quote.taxAmount || 0) / Number(quote.subtotal)) * 100) : 18;
    setTaxPercent(taxPct || 18);
    setDiscount(quote.discountAmount || 0);
    setNotes(quote.notes || '');
    if (selectedQuoteForDetail) setSelectedQuoteForDetail(null);
    setIsCreatingNew(true);
  };

  const subtotal = quoteItems.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
  const taxAmount = (subtotal * Number(taxPercent || 0)) / 100;
  const totalAmount = Math.max(0, subtotal + taxAmount - Number(discount || 0));

  const handleSaveQuotation = async () => {
    if (!selectedCustomerId) return alert('Please select or register a customer for this quotation');
    if (quoteItems.length === 0) return alert('Please calculate and add at least one glass line item to the quotation');

    setIsSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomerId,
        subtotal,
        taxAmount,
        discountAmount: Number(discount || 0),
        taxPercent: Number(taxPercent || 0),
        totalAmount,
        notes,
        status: editingQuote ? editingQuote.status : 'DRAFT',
        items: quoteItems,
      };

      const result = editingQuote
        ? await api.updateQuotation(editingQuote.id, payload)
        : await api.createQuotation(payload);

      if (result) {
        resetForm();
        setIsCreatingNew(false);
        await loadData();
      } else {
        alert('Could not save quotation. Please verify input fields.');
      }
    } catch (err) {
      console.error('Failed to save quotation:', err);
      alert(`Error saving quotation: ${err.message || 'Server error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    await api.updateQuotationStatus(id, status);
    loadData();
    if (selectedQuoteForDetail?.id === id) setSelectedQuoteForDetail((prev) => (prev ? { ...prev, status } : null));
  };

  const handleDeleteQuotation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) return;
    try {
      await api.deleteQuotation(id);
      if (selectedQuoteForDetail?.id === id) setSelectedQuoteForDetail(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete quotation:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {editingQuote
              ? `Edit Draft Quotation: ${editingQuote.quotationNumber}`
              : 'Precision Glass Estimations & Quotations'}
          </h2>
          <p className="text-xs text-slate-500">
            {editingQuote
              ? 'Modify glass pane specs, edge polishing, dimensions, hole cutouts, or customer terms'
              : 'Formulate custom glass quotes by m², thickness, edge grinding/polishing, and CNC operations'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isCreatingNew ? (
            <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => { resetForm(); setIsCreatingNew(false); }}>
              Back to Quotations Register
            </Button>
          ) : (
            <>
              <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadData} isLoading={loading}>
                Refresh
              </Button>
              <Button variant="primary" size="sm" icon={Plus} onClick={() => { resetForm(); setIsCreatingNew(true); }}>
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
            <Card title="1. Customer & Glazing Site Details" subtitle="Link quotation to registered contractor or individual">
              <CustomerSelector
                customers={customers}
                selectedCustomerId={selectedCustomerId}
                onSelectCustomer={setSelectedCustomerId}
                onAddNewCustomer={handleAddNewCustomer}
              />
            </Card>

            <Card title="2. Glass Specifications & Cutlist Calculator" subtitle="Dynamic pricing based on surface area (m²), edge polishing, and CNC hole milling">
              <GlassItemCalculator items={quoteItems} onAddItem={handleAddItem} onRemoveItem={handleRemoveItem} onUpdateItem={handleUpdateItem} />
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

              <div className="pt-4 mt-4 border-t border-slate-200">
                <Button
                  variant="primary"
                  className="w-full"
                  size="lg"
                  disabled={quoteItems.length === 0 || !selectedCustomerId}
                  isLoading={isSubmitting}
                  onClick={handleSaveQuotation}
                >
                  {editingQuote ? 'Update Quotation' : 'Save & Issue Quotation'}
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
          onEditQuote={handleEditQuote}
          onDeleteQuote={handleDeleteQuotation}
        />
      )}

      {/* Full Detail & Printable Modal */}
      <QuotationDetailModal
        isOpen={Boolean(selectedQuoteForDetail)}
        onClose={() => setSelectedQuoteForDetail(null)}
        quotation={selectedQuoteForDetail}
        onUpdateStatus={handleUpdateStatus}
        onEditQuote={handleEditQuote}
        onDeleteQuote={handleDeleteQuotation}
      />
    </div>
  );
}
