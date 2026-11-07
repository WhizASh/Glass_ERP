import React, { useState, useEffect } from 'react';
import QuotationFilterBar from '../quotations/QuotationFilterBar';
import QuotationTable from '../quotations/QuotationTable';
import QuotationDrawer from '../quotations/QuotationDrawer';
import QuotationPrintView from '../quotations/QuotationPrintView';
import QuotationBuilderModal from '../quotations/builder/QuotationBuilderModal';
import { api } from '../../services/api';
import { calculateLineItemMetrics } from '../../lib/glassCalculations';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const createInitialFormState = () => ({
  customerId: '',
  validUntil: getTodayDateString(),
  taxRate: 18,
  discountType: 'PERCENTAGE',
  discountValue: '',
  notes: '',
  sections: [
    {
      sectionName: 'Ground Floor Elevation',
      items: [
        {
          productSkuId: '',
          description: '',
          widthInches: '',
          heightInches: '',
          quantity: 1,
          unitPrice: 0
        }
      ]
    }
  ]
});

const QuotationsView = () => {
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [printQuotation, setPrintQuotation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [formData, setFormData] = useState(createInitialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQuotations = () => {
    setLoading(true);
    const params = {};
    if (selectedStatus !== 'ALL') params.status = selectedStatus;
    if (searchQuery.trim()) params.q = searchQuery.trim();

    api.getQuotations(params)
      .then((data) => setQuotations(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.warn('Quotations fetch notice:', err.message);
        setQuotations([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuotations();
  }, [selectedStatus, searchQuery]);

  useEffect(() => {
    api.getCustomers().then((data) => setCustomers(Array.isArray(data) ? data : [])).catch(() => {});
    api.getProducts().then((data) => setProducts(Array.isArray(data) ? data : [])).catch(() => {});
  }, [isModalOpen]);

  // Status counts
  const statusCounts = quotations.reduce(
    (acc, q) => {
      acc.ALL = (acc.ALL || 0) + 1;
      acc[q.status] = (acc[q.status] || 0) + 1;
      return acc;
    },
    { ALL: quotations.length }
  );

  const handleOpenCreateModal = () => {
    setEditingQuotation(null);
    setFormData(createInitialFormState());
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (quote) => {
    if (!quote) return;
    if (quote.status !== 'DRAFT' && quote.status !== 'SENT') {
      alert(`Quotation ${quote.quoteNumber} is in ${quote.status} status and cannot be edited. Only DRAFT and SENT quotes can be modified.`);
      return;
    }

    const rawSections = quote.sections || [];
    const mappedSections = rawSections.length > 0
      ? rawSections.map((sec, sIdx) => {
          const rawItems = Array.isArray(sec.items) ? sec.items : (sec.items?.create || []);
          return {
            id: sec.id,
            sectionName: sec.sectionName || `Section ${sIdx + 1}`,
            items: rawItems.map((item) => ({
              id: item.id,
              productSkuId: item.productSkuId || '',
              description: item.description || '',
              widthInches: item.widthInches !== null && item.widthInches !== undefined ? String(item.widthInches) : '',
              heightInches: item.heightInches !== null && item.heightInches !== undefined ? String(item.heightInches) : '',
              quantity: item.quantity !== undefined ? item.quantity : 1,
              unitPrice: item.unitPrice !== undefined ? Number(item.unitPrice) : 0
            }))
          };
        })
      : createInitialFormState().sections;

    setFormData({
      customerId: quote.customerId || quote.customer?.id || '',
      validUntil: quote.validUntil ? quote.validUntil.split('T')[0] : getTodayDateString(),
      taxRate: quote.taxRate !== undefined ? Number(quote.taxRate) : 18,
      discountType: quote.discountType || 'PERCENTAGE',
      discountValue: quote.discountValue !== undefined ? Number(quote.discountValue) : '',
      notes: quote.notes || '',
      sections: mappedSections
    });

    setEditingQuotation(quote);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId) {
      alert('Please select a customer for this quotation.');
      return;
    }

    if (!formData.sections || formData.sections.length === 0) {
      alert('Please add at least one floor or elevation section.');
      return;
    }

    for (let s = 0; s < formData.sections.length; s++) {
      const sec = formData.sections[s];
      if (!sec.items || sec.items.length === 0) {
        alert(`Section "${sec.sectionName || s + 1}" must have at least one glass specification.`);
        return;
      }
      for (let i = 0; i < sec.items.length; i++) {
        const item = sec.items[i];
        if (!item.productSkuId) {
          alert(`Please select a glass specification SKU for Section "${sec.sectionName || s + 1}", item #${i + 1}.`);
          return;
        }
        const w = parseFloat(item.widthInches);
        const h = parseFloat(item.heightInches);
        if (!w || w <= 0 || !h || h <= 0) {
          alert(`Please enter valid positive Cut Size (Width and Height in inches) for Section "${sec.sectionName || s + 1}", item #${i + 1}.`);
          return;
        }
      }
    }

    // Format line items with inch calculations and commercial rounding
    const formattedSections = formData.sections.map((sec) => ({
      ...sec,
      items: sec.items.map((item) => {
        const metrics = calculateLineItemMetrics(item);
        return {
          productSkuId: item.productSkuId,
          description: item.description,
          widthInches: item.widthInches !== '' && item.widthInches !== null ? parseFloat(item.widthInches) : null,
          heightInches: item.heightInches !== '' && item.heightInches !== null ? parseFloat(item.heightInches) : null,
          roundedWidthInches: metrics.roundedWidth || null,
          roundedHeightInches: metrics.roundedHeight || null,
          quantity: parseFloat(item.quantity) || 1,
          areaSqFt: metrics.sqft || null,
          unitPrice: parseFloat(item.unitPrice) || 0,
          totalPrice: metrics.lineTotal
        };
      })
    }));

    setIsSubmitting(true);
    try {
      if (editingQuotation) {
        const updated = await api.updateQuotation(editingQuotation.id, {
          ...formData,
          discountType: formData.discountType || 'PERCENTAGE',
          discountValue: parseFloat(formData.discountValue) || 0,
          taxRate: parseFloat(formData.taxRate) || 0,
          sections: formattedSections
        });

        if (updated) {
          const matchedCust = customers.find((c) => c.id === formData.customerId) || updated.customer;
          const normalized = {
            ...updated,
            customer: matchedCust || updated.customer,
            sections: (updated.sections || []).map((sec) => ({
              ...sec,
              items: Array.isArray(sec.items) ? sec.items : (sec.items?.create || [])
            }))
          };
          setQuotations((prev) => prev.map((q) => (q.id === normalized.id ? normalized : q)));
          if (selectedQuotation && selectedQuotation.id === normalized.id) {
            setSelectedQuotation(normalized);
          }
        }

        setIsModalOpen(false);
        setEditingQuotation(null);
        setFormData(createInitialFormState());
        fetchQuotations();
      } else {
        const created = await api.createQuotation({
          ...formData,
          discountType: formData.discountType || 'PERCENTAGE',
          discountValue: parseFloat(formData.discountValue) || 0,
          taxRate: parseFloat(formData.taxRate) || 0,
          sections: formattedSections
        });

        if (created) {
          const matchedCust = customers.find((c) => c.id === formData.customerId) || created.customer;
          const normalized = {
            ...created,
            customer: matchedCust || created.customer,
            sections: (created.sections || []).map((sec) => ({
              ...sec,
              items: Array.isArray(sec.items) ? sec.items : (sec.items?.create || [])
            }))
          };
          setQuotations((prev) => [normalized, ...prev.filter((q) => q.id !== normalized.id)]);
        }

        setIsModalOpen(false);
        setFormData(createInitialFormState());
        fetchQuotations();
      }
    } catch (err) {
      alert(`Failed to ${editingQuotation ? 'update' : 'create'} quotation: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdated = (id, newStatus) => {
    setQuotations((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
    );
    if (selectedQuotation && selectedQuotation.id === id) {
      setSelectedQuotation((prev) => ({ ...prev, status: newStatus }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <QuotationFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        statusCounts={statusCounts}
        onOpenCreateModal={handleOpenCreateModal}
      />

      {/* Main Architectural Quotations Table */}
      <QuotationTable
        quotations={quotations}
        loading={loading}
        onSelectQuotation={(quote) => setSelectedQuotation(quote)}
        onPrintQuotation={(quote) => setPrintQuotation(quote)}
        onEditQuotation={handleOpenEditModal}
        selectedQuotationId={selectedQuotation?.id}
        onOpenCreateModal={handleOpenCreateModal}
      />

      {/* Slide-over Inspection Drawer */}
      <QuotationDrawer
        quotation={selectedQuotation}
        onClose={() => setSelectedQuotation(null)}
        onStatusUpdated={handleStatusUpdated}
        onEditQuotation={handleOpenEditModal}
      />

      {/* Multi-Section Quotation Builder Modal */}
      <QuotationBuilderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingQuotation(null);
        }}
        formData={formData}
        setFormData={setFormData}
        customers={customers}
        setCustomers={setCustomers}
        products={products}
        setProducts={setProducts}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        editingQuotation={editingQuotation}
      />

      {/* Direct Quotation Print View */}
      {printQuotation && (
        <QuotationPrintView
          quotation={printQuotation}
          onClose={() => setPrintQuotation(null)}
        />
      )}
    </div>
  );
};

export default QuotationsView;
