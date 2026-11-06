import React, { useState, useEffect } from 'react';
import QuotationFilterBar from '../quotations/QuotationFilterBar';
import QuotationTable from '../quotations/QuotationTable';
import QuotationDrawer from '../quotations/QuotationDrawer';
import QuotationBuilderModal from '../quotations/builder/QuotationBuilderModal';
import { api } from '../../services/api';

const initialFormState = {
  customerId: '',
  validUntil: '',
  taxRate: 18,
  notes: '',
  sections: [
    {
      sectionName: 'Ground Floor Facade',
      items: [
        { productSkuId: '', description: '', widthMm: '', heightMm: '', quantity: 1, unitPrice: 0 }
      ]
    }
  ]
};

const QuotationsView = () => {
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId) {
      alert('Please select a customer for this quotation.');
      return;
    }

    // Format line items with area calculation
    const formattedSections = formData.sections.map((sec) => ({
      ...sec,
      items: sec.items.map((item) => {
        const width = parseFloat(item.widthMm) || 0;
        const height = parseFloat(item.heightMm) || 0;
        const qty = parseFloat(item.quantity) || 1;
        const price = parseFloat(item.unitPrice) || 0;
        const area = width > 0 && height > 0 ? (width * height) / 1000000 : null;
        const totalPrice = area ? qty * area * price : qty * price;
        return {
          ...item,
          areaSqM: area,
          totalPrice
        };
      })
    }));

    setIsSubmitting(true);
    try {
      await api.createQuotation({
        ...formData,
        sections: formattedSections
      });
      setIsModalOpen(false);
      setFormData(initialFormState);
      fetchQuotations();
    } catch (err) {
      alert(`Failed to create quotation: ${err.message}`);
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
        onOpenCreateModal={() => setIsModalOpen(true)}
      />

      {/* Main Architectural Quotations Table */}
      <QuotationTable
        quotations={quotations}
        loading={loading}
        onSelectQuotation={(quote) => setSelectedQuotation(quote)}
        selectedQuotationId={selectedQuotation?.id}
        onOpenCreateModal={() => setIsModalOpen(true)}
      />

      {/* Slide-over Inspection Drawer */}
      <QuotationDrawer
        quotation={selectedQuotation}
        onClose={() => setSelectedQuotation(null)}
        onStatusUpdated={handleStatusUpdated}
      />

      {/* Multi-Section Quotation Builder Modal */}
      <QuotationBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        customers={customers}
        products={products}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default QuotationsView;
