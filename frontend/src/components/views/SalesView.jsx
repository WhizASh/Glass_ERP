import React, { useState, useEffect } from 'react';
import { Plus, Filter, Edit3, Lock, Unlock, Eye, CreditCard, Banknote, UserPlus } from 'lucide-react';
import DataTable from '../common/DataTable';
import SaleOrderModal from '../sales/SaleOrderModal';
import StatusBadge from '../common/StatusBadge';
import QuickCustomerModal from '../common/QuickCustomerModal';
import { api } from '../../services/api';
import { calculateItemSqft, calculateDiscount } from '../../lib/glassCalculations';

const PAYMENT_STATUS_FILTERS = ['ALL', 'UNPAID', 'PARTIAL', 'PAID'];

const INITIAL_FORM_STATE = {
  customerId: '',
  quotationId: '',
  deliveryAddress: '',
  paymentMode: 'CASH',
  paymentStatus: 'UNPAID',
  amountReceived: '0', paymentDate: '', paymentReference: '',
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
      amountReceived: order.amountReceived || '0', paymentDate: order.paymentDate?.slice(0, 10) || '', paymentReference: order.paymentReference || '',
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
    if (isSubmitting) return;
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

      {isModalOpen && <SaleOrderModal
        form={formData} setForm={setFormData} order={editingSaleOrder}
        customers={customers} quotations={quotations} products={products}
        totals={{ totalGlazingSqft, subtotal, discountAmount, taxableSubtotal, taxRate, taxAmount, totalAmount }}
        locked={isOrderLocked} delivered={isOrderDelivered} saving={isSubmitting}
        error={formError} nestedDialogOpen={isAddCustomerOpen}
        onClose={() => { setIsModalOpen(false); setEditingSaleOrder(null); }}
        onSubmit={handleSubmit} onQuotationChange={handleQuotationChange}
        onAddCustomer={() => setIsAddCustomerOpen(true)}
        onAddItem={addItem} onRemoveItem={removeItem} onUpdateItem={updateItem}
        getSqft={getItemSqft} getLineTotal={getItemLineTotal}
        onUnlock={async () => {
          const sale = editingSaleOrder;
          setIsModalOpen(false);
          setEditingSaleOrder(null);
          await handleToggleLock(sale);
        }}
      />}

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
