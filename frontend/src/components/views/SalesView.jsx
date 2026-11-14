import React, { useState, useEffect } from 'react';
import { Plus, Filter, Trash2, Edit3, Lock, Unlock, Eye, CreditCard, Banknote, CheckCircle2, FileText, UserPlus, Layers, Tag } from 'lucide-react';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import QuickCustomerModal from '../common/QuickCustomerModal';
import { api } from '../../services/api';
import { calculateItemSqft, formatBillingSize, calculateDiscount } from '../../lib/glassCalculations';

const PAYMENT_STATUS_FILTERS = ['ALL', 'UNPAID', 'PARTIAL', 'PAID'];

const INITIAL_FORM_STATE = {
  customerId: '',
  quotationId: '',
  deliveryAddress: '',
  paymentMode: 'CASH',
  paymentStatus: 'UNPAID',
  status: 'PENDING',
  isLocked: false,
  discountType: 'PERCENTAGE',
  discountValue: 0,
  taxRate: 0,
  items: [
    {
      productSkuId: '',
      description: '',
      widthInches: '',
      heightInches: '',
      quantity: 1,
      totalSqft: '',
      unitPrice: 0
    }
  ]
};

const SalesView = () => {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSaleOrder, setEditingSaleOrder] = useState(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleCustomerCreated = (newCustomer) => {
    setCustomers(prev => [newCustomer, ...prev]);
    setFormData(prev => ({
      ...prev,
      customerId: newCustomer.id,
      deliveryAddress: prev.deliveryAddress || newCustomer.address || ''
    }));
  };

  const fetchSales = () => {
    setLoading(true);
    const params = {};
    if (selectedPaymentStatus !== 'ALL') params.paymentStatus = selectedPaymentStatus;

    api.getSales(params)
      .then((data) => {
        setSales(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.warn('Sales fetch notice:', err.message);
        setSales([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSales();
  }, [selectedPaymentStatus]);

  useEffect(() => {
    api.getCustomers().then(data => setCustomers(Array.isArray(data) ? data : [])).catch(() => {});
    api.getQuotations().then(data => setQuotations(Array.isArray(data) ? data : [])).catch(() => {});
    api.getProducts().then(data => setProducts(Array.isArray(data) ? data : [])).catch(() => {});
  }, [isModalOpen]);

  const populateFormData = (order) => {
    setFormData({
      customerId: order.customerId || order.customer?.id || '',
      quotationId: order.quotationId || order.quotation?.id || '',
      deliveryAddress: order.deliveryAddress || '',
      paymentMode: (order.paymentMode || 'CASH').toUpperCase() === 'ONLINE' ? 'ONLINE' : 'CASH',
      paymentStatus: order.paymentStatus || 'UNPAID',
      status: order.status || 'PENDING',
      isLocked: Boolean(order.isLocked),
      discountType: order.discountType || 'PERCENTAGE',
      discountValue: Number(order.discountValue) || 0,
      taxRate: Number(order.taxRate) || 0,
      items: Array.isArray(order.items) && order.items.length > 0
        ? order.items.map(item => {
            const w = item.widthInches !== null && item.widthInches !== undefined ? Number(item.widthInches) : '';
            const h = item.heightInches !== null && item.heightInches !== undefined ? Number(item.heightInches) : '';
            const q = Number(item.quantity) || 1;
            const sqftPerPiece = (w && h) ? calculateItemSqft(w, h) : (Number(item.areaSqFt) || 0);
            const totalSqft = sqftPerPiece > 0
              ? Number((sqftPerPiece * q).toFixed(2))
              : (Number(item.areaSqFt) ? Number((Number(item.areaSqFt) * q).toFixed(2)) : '');

            return {
              id: item.id,
              sectionName: item.sectionName || '',
              productSkuId: item.productSkuId || '',
              description: item.description || item.productSku?.name || 'Glass Fabricated Unit',
              widthInches: w,
              heightInches: h,
              quantity: q,
              totalSqft: totalSqft,
              unitPrice: item.unitPrice !== undefined ? Number(item.unitPrice) : 0
            };
          })
        : [
            {
              productSkuId: '',
              description: '',
              widthInches: '',
              heightInches: '',
              quantity: 1,
              totalSqft: '',
              unitPrice: 0
            }
          ]
    });
  };

  const handleOpenCreateModal = () => {
    setEditingSaleOrder(null);
    setFormError(null);
    setFormData(INITIAL_FORM_STATE);
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (order) => {
    setEditingSaleOrder(order);
    setFormError(null);
    populateFormData(order);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (order) => {
    if (order.status === 'CANCELLED') {
      alert('Cancelled orders cannot be modified.');
      return;
    }
    if (order.isLocked) {
      handleOpenViewModal(order);
      return;
    }

    setEditingSaleOrder(order);
    setFormError(null);
    populateFormData(order);
    setIsModalOpen(true);
  };

  const handleToggleLock = async (order) => {
    const isCurrentlyLocked = Boolean(order.isLocked);
    const willLock = !isCurrentlyLocked;

    if (willLock && order.paymentStatus !== 'PAID') {
      alert('Cannot lock sale record: Payment is not complete.\n\nOnly orders with payment status PAID can be locked.');
      return;
    }

    const confirmMsg = willLock
      ? `Lock Sale Order ${order.orderNumber}?\n\nPayment is complete. Once locked, dimensions, rates, and amounts will be protected against modifications.`
      : `Unlock Sale Order ${order.orderNumber}?\n\nThis will allow modifications to line items, prices, and client details.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.toggleSaleLock(order.id, willLock);
      fetchSales();
    } catch (err) {
      alert(err.message || 'Failed to update lock status');
    }
  };

  const handleQuotationChange = async (quotationId) => {
    if (!quotationId) {
      setFormData(prev => ({
        ...prev,
        quotationId: '',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        taxRate: 0
      }));
      return;
    }

    let targetQuote = quotations.find(q => q.id === quotationId);
    try {
      const fullQuote = await api.getQuotationById(quotationId);
      if (fullQuote) targetQuote = fullQuote;
    } catch (err) {
      console.warn('Could not fetch full quotation details, using list quote:', err);
    }

    if (targetQuote) {
      const quoteCustomer = targetQuote.customer || customers.find(c => c.id === targetQuote.customerId);
      const quoteItems = [];

      if (Array.isArray(targetQuote.sections)) {
        targetQuote.sections.forEach(sec => {
          const secItems = Array.isArray(sec.items) ? sec.items : [];
          secItems.forEach(item => {
            const w = item.widthInches !== null && item.widthInches !== undefined ? Number(item.widthInches) : '';
            const h = item.heightInches !== null && item.heightInches !== undefined ? Number(item.heightInches) : '';
            const q = Number(item.quantity) || 1;
            const sqftPerPiece = (w && h) ? calculateItemSqft(w, h) : (Number(item.areaSqFt) || 0);
            const totalSqft = sqftPerPiece > 0
              ? Number((sqftPerPiece * q).toFixed(2))
              : (Number(item.areaSqFt) ? Number((Number(item.areaSqFt) * q).toFixed(2)) : '');
            const baseName = item.description || item.productSku?.name || 'Glass Fabricated Unit';

            quoteItems.push({
              id: item.id || `quote-item-${Math.random()}`,
              sectionName: sec.sectionName || null,
              productSkuId: item.productSkuId || '',
              description: baseName,
              widthInches: w,
              heightInches: h,
              quantity: q,
              totalSqft: totalSqft,
              unitPrice: Number(item.unitPrice) || 0
            });
          });
        });
      }

      setFormData(prev => ({
        ...prev,
        quotationId,
        customerId: targetQuote.customerId || prev.customerId,
        deliveryAddress: prev.deliveryAddress || quoteCustomer?.address || '',
        discountType: targetQuote.discountType || 'PERCENTAGE',
        discountValue: Number(targetQuote.discountValue) || 0,
        taxRate: Number(targetQuote.taxRate) || 0,
        items: quoteItems.length > 0 ? quoteItems : prev.items
      }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productSkuId: '',
          description: '',
          widthInches: '',
          heightInches: '',
          quantity: 1,
          totalSqft: '',
          unitPrice: 0
        }
      ]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.items];
      const cur = { ...updated[index], [field]: value };

      // When SKU is selected, auto-fill description and unitPrice (rate/sqft)
      if (field === 'productSkuId') {
        const foundSku = products.find(p => p.id === value);
        if (foundSku) {
          cur.productSkuId = foundSku.id;
          cur.description = foundSku.name + (foundSku.thicknessMm ? ` (${foundSku.thicknessMm}mm)` : '');
          cur.unitPrice = Number(foundSku.unitPrice) || 0;
        }
      }

      // When width, height, or quantity changes, auto-recalculate total sqft via 6-inch commercial grid
      if (field === 'widthInches' || field === 'heightInches' || field === 'quantity') {
        const w = parseFloat(field === 'widthInches' ? value : cur.widthInches) || 0;
        const h = parseFloat(field === 'heightInches' ? value : cur.heightInches) || 0;
        const q = parseFloat(field === 'quantity' ? value : cur.quantity) || 1;
        if (w > 0 && h > 0) {
          const sqftPerPiece = calculateItemSqft(w, h);
          cur.totalSqft = Number((sqftPerPiece * q).toFixed(2));
        }
      }

      updated[index] = cur;
      return { ...prev, items: updated };
    });
  };

  const getItemSqft = (item) => {
    if (item.totalSqft !== undefined && item.totalSqft !== null && item.totalSqft !== '') {
      return parseFloat(item.totalSqft) || 0;
    }
    const w = parseFloat(item.widthInches) || 0;
    const h = parseFloat(item.heightInches) || 0;
    const q = parseFloat(item.quantity) || 1;
    if (w > 0 && h > 0) {
      return Number((calculateItemSqft(w, h) * q).toFixed(2));
    }
    return parseFloat(item.areaSqFt) || 0;
  };

  const getItemLineTotal = (item) => {
    const sqft = getItemSqft(item);
    const price = parseFloat(item.unitPrice) || 0;
    const qty = parseFloat(item.quantity) || 1;
    if (sqft > 0) {
      return Number((sqft * price).toFixed(2));
    }
    return Number((qty * price).toFixed(2));
  };

  const totalGlazingSqft = formData.items.reduce((sum, item) => sum + getItemSqft(item), 0);
  const subtotal = formData.items.reduce((sum, item) => sum + getItemLineTotal(item), 0);
  const discountType = formData.discountType || 'PERCENTAGE';
  const discountValue = parseFloat(formData.discountValue) || 0;
  const discountAmount = calculateDiscount(subtotal, discountType, discountValue);
  const taxableSubtotal = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));
  const taxRate = parseFloat(formData.taxRate) || 0;
  const taxAmount = Number(((taxableSubtotal * taxRate) / 100).toFixed(2));
  const totalAmount = Number((taxableSubtotal + taxAmount).toFixed(2));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId) {
      setFormError('Please choose or confirm a customer.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        quotationId: formData.quotationId || null,
        discountType,
        discountValue,
        taxRate,
        items: formData.items.map(it => ({
          ...it,
          quantity: parseFloat(it.quantity) || 1,
          widthInches: it.widthInches ? parseFloat(it.widthInches) : null,
          heightInches: it.heightInches ? parseFloat(it.heightInches) : null,
          totalSqft: it.totalSqft !== undefined && it.totalSqft !== null && it.totalSqft !== '' ? parseFloat(it.totalSqft) : null,
          unitPrice: parseFloat(it.unitPrice) || 0
        }))
      };

      if (editingSaleOrder) {
        await api.updateSale(editingSaleOrder.id, payload);
      } else {
        await api.createSale(payload);
      }

      setIsModalOpen(false);
      setEditingSaleOrder(null);
      setFormError(null);
      setFormData(INITIAL_FORM_STATE);
      fetchSales();
    } catch (err) {
      setFormError(err.message || 'Failed to save sale order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOrderDelivered = editingSaleOrder?.status === 'DELIVERED';
  const isOrderLocked = Boolean(editingSaleOrder?.isLocked);

  const columns = [
    {
      header: 'Order #',
      accessor: 'orderNumber',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-edge-800 bg-edge-50 px-2 py-0.5 rounded border border-edge-200">
          {row.orderNumber}
        </span>
      )
    },
    {
      header: 'Customer / Project',
      accessor: 'customer',
      render: (row) => (
        <div>
          <span className="font-semibold text-steel-900">
            {row.customer?.companyName || row.customer?.name || '—'}
          </span>
          {row.quotation?.quoteNumber && (
            <span className="block text-[11px] text-edge-700 font-mono">
              From Invoice/Quote: #{row.quotation.quoteNumber}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Order Date',
      accessor: 'orderDate',
      render: (row) => (
        <span className="text-xs font-mono text-steel-600">
          {row.orderDate ? new Date(row.orderDate).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      header: 'Payment Mode',
      accessor: 'paymentMode',
      render: (row) => {
        const mode = (row.paymentMode || 'CASH').toUpperCase();
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
            mode === 'ONLINE'
              ? 'bg-blue-50 text-blue-800 border-blue-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            {mode === 'ONLINE' ? <CreditCard className="w-3 h-3 text-blue-600" /> : <Banknote className="w-3 h-3 text-emerald-600" />}
            <span>{mode === 'ONLINE' ? 'NEFT / UPI / Card' : 'Cash'}</span>
          </span>
        );
      }
    },
    {
      header: 'Payment Status',
      accessor: 'paymentStatus',
      render: (row) => <StatusBadge status={row.paymentStatus} />
    },
    {
      header: 'Total Amount',
      accessor: 'totalAmount',
      align: 'right',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-steel-900 block">
            ₹{Number(row.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {Number(row.discountAmount) > 0 && (
            <span className="text-[10px] text-amber-700 font-mono block">
              (Disc: -₹{Number(row.discountAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
            </span>
          )}
          {Number(row.taxRate) > 0 && (
            <span className="text-[10px] text-teal-700 font-mono block">
              (Incl. {row.taxRate}% GST)
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      align: 'center',
      render: (row) => {
        const isCancelled = row.status === 'CANCELLED';
        if (isCancelled) {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] text-steel-400 font-mono py-1 px-2 rounded bg-steel-50 border border-steel-200" title="Cancelled orders cannot be edited">
              <Lock className="w-3 h-3 text-steel-400" />
              <span>Cancelled</span>
            </span>
          );
        }

        const isPaid = row.paymentStatus === 'PAID';
        const isLocked = Boolean(row.isLocked);

        if (isLocked) {
          return (
            <div className="inline-flex items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1 text-[11px] font-mono py-0.5 px-2 rounded font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 shadow-2xs"
                title="Payment complete — record locked against edits"
              >
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Locked</span>
              </span>
              <button
                type="button"
                onClick={() => handleOpenViewModal(row)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-steel-700 bg-steel-100 hover:bg-steel-200 border border-steel-300 transition-colors shadow-2xs"
                title="View order details (Read-only)"
              >
                <Eye className="w-3.5 h-3.5 text-steel-600" />
                <span>View</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleLock(row)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-amber-700 hover:bg-amber-50 border border-amber-200 transition-colors"
                title="Unlock record for editing"
              >
                <Unlock className="w-3 h-3 text-amber-600" />
                <span>Unlock</span>
              </button>
            </div>
          );
        }

        return (
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleOpenEditModal(row)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors shadow-2xs"
              title="Edit Order, Update Payment Status or Adjust Details"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            {isPaid && (
              <button
                type="button"
                onClick={() => handleToggleLock(row)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors shadow-2xs"
                title="Payment complete — lock this sale record against changes"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Lock</span>
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="bg-white rounded-lg border border-steel-200 p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-steel-400 shrink-0" />
          <span className="text-xs font-semibold text-steel-600 uppercase tracking-wider mr-1 shrink-0">Payment:</span>
          {PAYMENT_STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedPaymentStatus(s)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                selectedPaymentStatus === s
                  ? 'filter-pill-active bg-slate-900 text-white font-semibold shadow-xs'
                  : 'filter-pill-inactive text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {s === 'ALL' ? 'All Orders' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsAddCustomerOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-md text-xs font-semibold bg-white border border-steel-300 text-steel-700 hover:bg-steel-50 hover:text-steel-900 shadow-2xs transition-colors"
            title="Register a new customer or contractor directly from sales view"
          >
            <UserPlus className="w-3.5 h-3.5 text-teal-600" />
            <span>+ Add Customer</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="btn-primary inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-md text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Sale Order</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={sales}
        loading={loading}
        tableAriaLabel="Sales Orders Table"
        emptyMessage="No sales orders recorded yet"
        emptySubtext="Convert approved invoices/quotations or record direct glass sales orders."
        actionButton={
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddCustomerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white border border-steel-300 text-steel-700 hover:bg-steel-50 shadow-2xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-teal-600" />
              <span>+ Add Customer</span>
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Sale Order</span>
            </button>
          </div>
        }
      />

      {/* Create / Edit Sale Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (isAddCustomerOpen) return;
          setIsModalOpen(false);
          setEditingSaleOrder(null);
        }}
        title={
          editingSaleOrder
            ? (isOrderLocked
                ? `View Sales Order — ${editingSaleOrder.orderNumber} 🔒 (Locked)`
                : `Edit Sales Order — ${editingSaleOrder.orderNumber}`)
            : 'Create Glass Fabrication & Sale Order'
        }
        subtitle={
          editingSaleOrder
            ? (isOrderLocked
                ? 'Payment is complete. This sale record is locked to preserve billing and fabrication integrity.'
                : 'Update payment status, payment mode, delivery address, or line items')
            : 'Select an Invoice to auto-fetch details, or create a direct glass order'
        }
        maxWidth="max-w-5xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Error Banner */}
          {formError && (
            <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
              <span>{formError}</span>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-rose-600 hover:text-rose-800 font-bold ml-2"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}

          {/* Locked Order Notice Banner */}
          {isOrderLocked && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <span>Sale Record Locked</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 font-semibold">PAID &amp; PROTECTED</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Payment is complete. Dimensions, rates, commercial discounts, and totals are locked against changes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const saleToUnlock = editingSaleOrder;
                  setIsModalOpen(false);
                  setEditingSaleOrder(null);
                  await handleToggleLock(saleToUnlock);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md font-semibold text-xs shadow-2xs transition-colors shrink-0"
                title="Unlock order for administrative editing"
              >
                <Unlock className="w-3.5 h-3.5 text-amber-600" />
                <span>Unlock Record</span>
              </button>
            </div>
          )}

          {/* Top Meta Card: Invoice, Customer, Discount, and Applicable GST */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 p-3.5 bg-steel-50 rounded-lg border border-steel-200">
            <div>
              <label htmlFor="sale-order-quotation" className="block text-xs font-semibold text-steel-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>Select Invoice / Quotation</span>
              </label>
              <select
                id="sale-order-quotation"
                name="quotationId"
                value={formData.quotationId}
                onChange={(e) => handleQuotationChange(e.target.value)}
                disabled={isOrderDelivered || isOrderLocked}
                className="w-full text-xs py-1.5 px-2 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600 font-medium disabled:bg-steel-100 disabled:text-steel-500"
              >
                <option value="">-- Direct Order (No Invoice) --</option>
                {quotations.map((q) => (
                  <option key={q.id} value={q.id}>
                    Invoice #{q.quoteNumber} — {q.customer?.companyName || q.customer?.name} (₹{Number(q.totalAmount).toLocaleString('en-IN')}) [{q.status}]
                  </option>
                ))}
              </select>
              {formData.quotationId && (
                <p className="text-[11px] text-teal-700 font-medium mt-1">
                  ✓ Customer &amp; bill-of-materials line items loaded from invoice.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="sale-order-customer" className="block text-xs font-semibold text-steel-700">
                  Customer / Project Client <span className="text-rose-600 font-bold" aria-hidden="true">*</span>
                </label>
                {!isOrderDelivered && !isOrderLocked && !formData.quotationId && (
                  <button
                    type="button"
                    onClick={() => setIsAddCustomerOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-edge-700 hover:text-edge-800 transition-colors"
                    title="Add a new customer directly for this direct order"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>+ Add Customer</span>
                  </button>
                )}
              </div>
              <select
                id="sale-order-customer"
                name="customerId"
                required
                value={formData.customerId}
                onChange={(e) => {
                  const selCustId = e.target.value;
                  const selCust = customers.find(c => c.id === selCustId);
                  setFormData(prev => ({
                    ...prev,
                    customerId: selCustId,
                    deliveryAddress: prev.deliveryAddress || selCust?.address || ''
                  }));
                }}
                disabled={isOrderDelivered || isOrderLocked || Boolean(formData.quotationId)}
                className="w-full text-xs py-1.5 px-2 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600 font-medium disabled:bg-steel-100 disabled:text-steel-600"
              >
                <option value="">-- Choose Customer --</option>
                {customers.length === 0 && (
                  <option value="" disabled>No customers found — click + Add Customer</option>
                )}
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName ? `${c.companyName} (${c.name})` : c.name} {c.city ? `· ${c.city}` : ''}
                  </option>
                ))}
              </select>
              {formData.quotationId && (
                <p className="text-[11px] text-steel-500 mt-1">
                  Customer locked to selected invoice.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="sale-order-discount" className="block text-xs font-semibold text-steel-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                <span>Commercial Discount</span>
              </label>
              <div className="flex gap-1.5">
                <select
                  disabled={isOrderDelivered || isOrderLocked}
                  value={formData.discountType || 'PERCENTAGE'}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-16 text-xs py-1.5 px-1 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 font-mono disabled:bg-steel-100"
                >
                  <option value="PERCENTAGE">%</option>
                  <option value="FIXED">₹</option>
                </select>
                <input
                  id="sale-order-discount"
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={isOrderDelivered || isOrderLocked}
                  placeholder="0"
                  value={formData.discountValue || ''}
                  onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs py-1.5 px-2 font-mono text-right bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 disabled:bg-steel-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="sale-order-tax-rate" className="block text-xs font-semibold text-steel-700 mb-1">
                Applicable GST (%)
              </label>
              <select
                id="sale-order-tax-rate"
                name="taxRate"
                value={formData.taxRate || 0}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                disabled={isOrderDelivered || isOrderLocked}
                className="w-full text-xs py-1.5 px-2 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600 font-medium disabled:bg-steel-100 disabled:text-steel-600"
              >
                <option value={0}>0% GST (Direct / Unregistered)</option>
                <option value={18}>18% GST (Standard Architectural Glass)</option>
                <option value={12}>12% GST (Composite Fabrication Supply)</option>
                <option value={5}>5% GST (Labour / Transport Component)</option>
              </select>
            </div>
          </div>

          {/* Payment Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-steel-50 rounded-lg border border-steel-200">
            <div>
              <label htmlFor="sale-order-payment-mode" className="block text-xs font-semibold text-steel-700 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Mode of Payment</span>
                <span className="text-rose-600 font-bold" aria-hidden="true">*</span>
              </label>
              <select
                id="sale-order-payment-mode"
                name="paymentMode"
                value={formData.paymentMode}
                disabled={isOrderLocked}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                className="w-full text-xs py-1.5 px-2 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600 font-medium disabled:bg-steel-100 disabled:text-steel-600"
              >
                <option value="CASH">Cash</option>
                <option value="ONLINE">NEFT / UPI / Card</option>
              </select>
            </div>

            <div>
              <label htmlFor="sale-order-payment-status" className="block text-xs font-semibold text-steel-700 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Payment Status</span>
                <span className="text-rose-600 font-bold" aria-hidden="true">*</span>
              </label>
              <select
                id="sale-order-payment-status"
                name="paymentStatus"
                value={formData.paymentStatus}
                disabled={isOrderLocked}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  setFormData({
                    ...formData,
                    paymentStatus: newStatus,
                    isLocked: newStatus === 'PAID' ? formData.isLocked : false
                  });
                }}
                className="w-full text-xs py-1.5 px-2 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600 font-medium disabled:bg-steel-100 disabled:text-steel-600"
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial Payment</option>
                <option value="PAID">Paid in Full</option>
              </select>
            </div>

            {formData.paymentStatus === 'PAID' && !isOrderLocked && (
              <div className="col-span-1 sm:col-span-2 p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-emerald-900 block">Lock Record upon Saving</span>
                    <span className="text-[11px] text-emerald-700">Payment is complete. Locks line items, rates, and totals against future modification.</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isLocked)}
                    onChange={(e) => setFormData({ ...formData, isLocked: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-steel-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-steel-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            )}
          </div>

          {/* Line Items Card: Glass Specifications & Area Calculations */}
          <div className="bg-white rounded-lg border border-steel-200 overflow-hidden shadow-xs">
            {/* Card Header */}
            <div className="px-3.5 py-2.5 bg-steel-50 border-b border-steel-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-edge-800 bg-edge-50 px-2 py-0.5 rounded border border-edge-200 shrink-0">
                  <Layers className="w-3 h-3 text-edge-600" />
                  ITEMS
                </span>
                <span className="text-xs font-bold text-steel-800">
                  Glass Specifications &amp; Cutting Area
                </span>
                {isOrderLocked ? (
                  <span className="ml-2 text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <Lock className="w-3 h-3 inline mr-1 text-emerald-600" />
                    Fabrication items locked (Payment Complete)
                  </span>
                ) : isOrderDelivered ? (
                  <span className="ml-2 text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <Lock className="w-3 h-3 inline mr-1" />
                    Fabrication items locked for delivered order
                  </span>
                ) : null}
              </div>

              {/* Section Metrics & Actions */}
              <div className="flex items-center gap-3">
                <div className="text-[11px] font-mono text-steel-600 flex items-center gap-2 bg-white px-2.5 py-1 rounded border border-steel-200">
                  <span>Area: <strong className="text-steel-900">{totalGlazingSqft.toFixed(2)} sqft</strong></span>
                  <span className="text-steel-300">|</span>
                  <span>Subtotal: <strong className="text-edge-700">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                </div>

                {!isOrderDelivered && !isOrderLocked && (
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-edge-700 bg-edge-50 hover:bg-edge-100 border border-edge-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Glass Item</span>
                  </button>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto p-2 sm:p-3 touch-scroll">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="text-[11px] font-semibold text-steel-500 uppercase tracking-wider border-b border-steel-200 pb-1">
                    <th className="pb-1.5 font-medium min-w-[240px]">
                      Glass Specification / SKU <span className="text-rose-600 font-bold" aria-hidden="true">*</span>
                    </th>
                    <th className="pb-1.5 text-right font-medium w-24">
                      Width (in)
                    </th>
                    <th className="pb-1.5 text-right font-medium w-24">
                      Height (in)
                    </th>
                    <th className="pb-1.5 text-center font-medium w-28">Billing Size</th>
                    <th className="pb-1.5 text-right font-medium w-24">Sqft</th>
                    <th className="pb-1.5 text-center font-medium w-16">
                      Qty <span className="text-rose-600 font-bold" aria-hidden="true">*</span>
                    </th>
                    <th className="pb-1.5 text-right font-medium w-24">
                      Rate (₹/sqft) <span className="text-rose-600 font-bold" aria-hidden="true">*</span>
                    </th>
                    <th className="pb-1.5 text-right font-medium w-28">Line Total</th>
                    {!isOrderDelivered && !isOrderLocked && <th className="pb-1.5 w-8"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-100">
                  {formData.items.map((item, idx) => {
                    const lineSqft = getItemSqft(item);
                    const lineTotal = getItemLineTotal(item);
                    const billingSize = (item.widthInches && item.heightInches)
                      ? formatBillingSize(item.widthInches, item.heightInches)
                      : null;

                    return (
                      <tr key={idx} className="border-b border-steel-100 hover:bg-steel-50/70 transition-colors">
                        {/* Glass SKU / Description */}
                        <td className="py-2.5 pr-2 min-w-[240px]">
                          <div className="space-y-1">
                            <select
                              disabled={isOrderDelivered || isOrderLocked}
                              aria-label={`Item ${idx + 1} catalog SKU`}
                              value={item.productSkuId || ''}
                              onChange={(e) => updateItem(idx, 'productSkuId', e.target.value)}
                              className="w-full text-xs py-1.5 px-2 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600 font-medium disabled:bg-steel-100 disabled:text-steel-600"
                            >
                              <option value="">-- Custom Glass Specification --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.skuCode} | {p.name} ({p.thicknessMm}mm) — ₹{Number(p.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/sqft
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              required
                              disabled={isOrderDelivered || isOrderLocked}
                              aria-label={`Item ${idx + 1} specification description`}
                              value={item.description || ''}
                              onChange={(e) => updateItem(idx, 'description', e.target.value)}
                              placeholder="e.g. 12mm Clear Toughened Architectural Glass"
                              className="w-full text-xs py-1 px-2 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 font-medium disabled:bg-steel-100 disabled:text-steel-600"
                            />
                          </div>
                        </td>

                        {/* Dimensions: Width in inches */}
                        <td className="py-2.5 px-1.5 w-24">
                          <input
                            type="number"
                            step="0.1"
                            min="1"
                            disabled={isOrderDelivered || isOrderLocked}
                            placeholder="e.g. 57"
                            aria-label={`Item ${idx + 1} width in inches`}
                            value={item.widthInches !== null && item.widthInches !== undefined ? item.widthInches : ''}
                            onChange={(e) => updateItem(idx, 'widthInches', e.target.value)}
                            className="w-full text-xs py-1.5 px-2 text-right font-mono bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600 disabled:bg-steel-100"
                          />
                        </td>

                        {/* Dimensions: Height in inches */}
                        <td className="py-2.5 px-1.5 w-24">
                          <input
                            type="number"
                            step="0.1"
                            min="1"
                            disabled={isOrderDelivered || isOrderLocked}
                            placeholder="e.g. 44"
                            aria-label={`Item ${idx + 1} height in inches`}
                            value={item.heightInches !== null && item.heightInches !== undefined ? item.heightInches : ''}
                            onChange={(e) => updateItem(idx, 'heightInches', e.target.value)}
                            className="w-full text-xs py-1.5 px-2 text-right font-mono bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600 disabled:bg-steel-100"
                          />
                        </td>

                        {/* Billing Size */}
                        <td className="py-2.5 px-1.5 w-28 text-center">
                          {billingSize ? (
                            <span className="inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200" title="Commercial 6-inch rounded slab size">
                              {billingSize}
                            </span>
                          ) : (
                            <span className="text-steel-400 font-mono text-[11px]">—</span>
                          )}
                        </td>

                        {/* Total Sqft */}
                        <td className="py-2.5 px-1.5 w-24">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            disabled={isOrderDelivered || isOrderLocked}
                            aria-label={`Item ${idx + 1} total sqft`}
                            value={item.totalSqft !== undefined && item.totalSqft !== null && item.totalSqft !== '' ? item.totalSqft : (lineSqft > 0 ? lineSqft : '')}
                            onChange={(e) => updateItem(idx, 'totalSqft', e.target.value)}
                            placeholder="0.00"
                            className="w-full text-xs py-1.5 px-2 text-right font-mono bg-amber-50/40 border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 disabled:bg-steel-100 disabled:text-steel-600"
                            title="Auto-calculated from dimensions & quantity (editable for manual override)"
                          />
                        </td>

                        {/* Quantity */}
                        <td className="py-2.5 px-1.5 w-16">
                          <input
                            type="number"
                            min="1"
                            required
                            disabled={isOrderDelivered || isOrderLocked}
                            aria-label={`Item ${idx + 1} quantity`}
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                            className="w-full text-xs py-1.5 px-2 text-center font-mono font-bold bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600 disabled:bg-steel-100 disabled:text-steel-600"
                          />
                        </td>

                        {/* Rate / Sqft */}
                        <td className="py-2.5 px-1.5 w-24">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            disabled={isOrderDelivered || isOrderLocked}
                            aria-label={`Item ${idx + 1} rate per sqft in rupees`}
                            value={item.unitPrice}
                            onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                            className="w-full text-xs py-1.5 px-2 text-right font-mono bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600 disabled:bg-steel-100 disabled:text-steel-600"
                          />
                        </td>

                        {/* Line Total */}
                        <td className="py-2.5 pl-2 text-right font-mono font-bold text-steel-900 whitespace-nowrap w-28">
                          ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Remove Action */}
                        {!isOrderDelivered && !isOrderLocked && (
                          <td className="py-2.5 pl-1 text-center w-8">
                            {formData.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="p-1 rounded text-steel-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Grid: Delivery Address on Left & Commercial Summary on Right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2">
            {/* Delivery / Plant Site Address */}
            <div className="space-y-3">
              <div>
                <label htmlFor="sale-order-delivery-address" className="block text-xs font-semibold text-steel-700 mb-1">
                  Delivery / Plant Site Address
                </label>
                <textarea
                  id="sale-order-delivery-address"
                  name="deliveryAddress"
                  rows={4}
                  disabled={isOrderLocked}
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  placeholder="e.g. Plot 14, Commercial Area, Hingna Road, Nagpur, Maharashtra..."
                  className="w-full text-xs p-2.5 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600 font-medium disabled:bg-steel-100 disabled:text-steel-600"
                />
              </div>
            </div>

            {/* Commercial Summary Card */}
            <div className="bg-steel-50 rounded-lg border border-steel-200 p-3.5 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-steel-600">
                <span>Total Glazing Area:</span>
                <span className="font-bold text-steel-900">
                  {totalGlazingSqft.toFixed(2)} sqft <span className="font-normal text-steel-400">({(totalGlazingSqft * 0.092903).toFixed(2)} m²)</span>
                </span>
              </div>

              <div className="flex justify-between text-steel-600">
                <span>Fabrication Subtotal:</span>
                <span className="font-semibold text-steel-800">
                  ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Commercial Discount ({discountType === 'PERCENTAGE' ? `${discountValue}%` : 'Fixed'}):</span>
                  <span className="font-semibold">
                    -₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex justify-between text-steel-600 font-medium">
                  <span>Taxable Subtotal:</span>
                  <span className="text-steel-800">
                    ₹{taxableSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {taxRate > 0 && (
                <div className="flex justify-between text-steel-600">
                  <span>Estimated GST ({taxRate}%):</span>
                  <span className="font-semibold text-steel-800">
                    ₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm font-bold pt-2 border-t border-steel-200 text-steel-900">
                <span>Order Grand Total:</span>
                <span className="text-edge-700 font-extrabold text-base">
                  ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-steel-200">
            {isOrderLocked ? (
              <>
                <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Record is locked in read-only mode</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSaleOrder(null);
                  }}
                  className="px-4 py-1.5 rounded-md text-xs font-semibold text-steel-700 bg-steel-100 border border-steel-300 hover:bg-steel-200 transition-colors shadow-2xs"
                >
                  Close
                </button>
              </>
            ) : (
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSaleOrder(null);
                  }}
                  className="px-4 py-2 sm:py-1.5 rounded-md text-xs font-semibold text-steel-700 bg-white border border-steel-300 hover:bg-steel-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 rounded-md text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {formData.isLocked && <Lock className="w-3.5 h-3.5" />}
                  <span>
                    {isSubmitting
                      ? (editingSaleOrder ? 'Saving Changes...' : 'Registering...')
                      : (editingSaleOrder
                          ? (formData.isLocked ? 'Save & Lock Order' : 'Save Order Changes')
                          : (formData.isLocked ? 'Create & Lock Order' : 'Create Sales Order'))
                    }
                  </span>
                </button>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* In-Place Quick Customer Creation Modal */}
      <QuickCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSuccess={handleCustomerCreated}
        subtitle="Create customer in-place without losing sales order progress"
      />
    </div>
  );
};

export default SalesView;
