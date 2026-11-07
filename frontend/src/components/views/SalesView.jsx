import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Filter, Trash2, Edit3, Lock, CreditCard, Banknote, CheckCircle2, FileText } from 'lucide-react';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { api } from '../../services/api';

const STATUS_FILTERS = ['ALL', 'PENDING', 'IN_PRODUCTION', 'READY', 'DELIVERED', 'CANCELLED'];

const INITIAL_FORM_STATE = {
  customerId: '',
  quotationId: '',
  deliveryAddress: '',
  paymentMode: 'CASH',
  paymentStatus: 'UNPAID',
  status: 'PENDING',
  items: [
    { productSkuId: '', description: '', widthMm: '', heightMm: '', quantity: 1, unitPrice: 0 }
  ]
};

const SalesView = () => {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSaleOrder, setEditingSaleOrder] = useState(null);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchSales = () => {
    setLoading(true);
    const params = {};
    if (selectedStatus !== 'ALL') params.status = selectedStatus;

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
  }, [selectedStatus]);

  useEffect(() => {
    api.getCustomers().then(data => setCustomers(Array.isArray(data) ? data : [])).catch(() => {});
    api.getQuotations().then(data => setQuotations(Array.isArray(data) ? data : [])).catch(() => {});
  }, [isModalOpen]);

  const handleOpenCreateModal = () => {
    setEditingSaleOrder(null);
    setFormError(null);
    setFormData(INITIAL_FORM_STATE);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (order) => {
    if (order.status === 'CANCELLED') {
      alert('Cancelled orders cannot be modified.');
      return;
    }

    setEditingSaleOrder(order);
    setFormError(null);
    setFormData({
      customerId: order.customerId || order.customer?.id || '',
      quotationId: order.quotationId || order.quotation?.id || '',
      deliveryAddress: order.deliveryAddress || '',
      paymentMode: (order.paymentMode || 'CASH').toUpperCase() === 'ONLINE' ? 'ONLINE' : 'CASH',
      paymentStatus: order.paymentStatus || 'UNPAID',
      status: order.status || 'PENDING',
      items: Array.isArray(order.items) && order.items.length > 0
        ? order.items.map(item => ({
            id: item.id,
            sectionName: item.sectionName || '',
            productSkuId: item.productSkuId || '',
            description: item.description || item.productSku?.name || 'Glass Fabricated Unit',
            widthMm: item.widthMm || '',
            heightMm: item.heightMm || '',
            quantity: item.quantity !== undefined ? Number(item.quantity) : 1,
            unitPrice: item.unitPrice !== undefined ? Number(item.unitPrice) : 0
          }))
        : [{ productSkuId: '', description: '', widthMm: '', heightMm: '', quantity: 1, unitPrice: 0 }]
    });
    setIsModalOpen(true);
  };

  const handleQuotationChange = async (quotationId) => {
    if (!quotationId) {
      setFormData(prev => ({
        ...prev,
        quotationId: ''
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
            const dimParts = [];
            if (item.widthInches && item.heightInches) {
              dimParts.push(`${item.widthInches}" × ${item.heightInches}"`);
            } else if (item.widthMm && item.heightMm) {
              dimParts.push(`${item.widthMm}mm × ${item.heightMm}mm`);
            }
            const baseName = item.description || item.productSku?.name || 'Glass Fabricated Unit';
            const desc = dimParts.length > 0 ? `${baseName} (${dimParts.join(', ')})` : baseName;

            quoteItems.push({
              id: item.id || `quote-item-${Math.random()}`,
              sectionName: sec.sectionName || null,
              productSkuId: item.productSkuId || null,
              description: desc,
              widthMm: item.widthMm || null,
              heightMm: item.heightMm || null,
              quantity: Number(item.quantity) || 1,
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
        items: quoteItems.length > 0 ? quoteItems : prev.items
      }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { productSkuId: '', description: '', widthMm: '', heightMm: '', quantity: 1, unitPrice: 0 }
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
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const totalAmount = formData.items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + (qty * price);
  }, 0);

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
        quotationId: formData.quotationId || null
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
      header: 'Fulfillment Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Total Amount',
      accessor: 'totalAmount',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-steel-900">
          ₹{Number(row.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
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
              <span>Locked</span>
            </span>
          );
        }
        return (
          <button
            type="button"
            onClick={() => handleOpenEditModal(row)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors shadow-2xs"
            title="Edit Order, Update Payment Status or Adjust Details"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        );
      }
    }
  ];

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="bg-white rounded-lg border border-steel-200 p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-steel-400 shrink-0" />
          <span className="text-xs font-semibold text-steel-600 uppercase tracking-wider mr-1 shrink-0">Status:</span>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedStatus === s
                  ? 'filter-pill-active bg-slate-900 text-white font-semibold shadow-xs'
                  : 'filter-pill-inactive text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {s === 'ALL' ? 'All Orders' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Sale Order</span>
        </button>
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={sales}
        tableAriaLabel="Sales Orders Table"
        emptyMessage="No sales orders recorded yet"
        emptySubtext="Convert approved invoices/quotations or record direct glass sales orders."
        actionButton={
          <button
            onClick={handleOpenCreateModal}
            className="btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Sale Order</span>
          </button>
        }
      />

      {/* Create / Edit Sale Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSaleOrder(null);
        }}
        title={editingSaleOrder ? `Edit Sales Order — ${editingSaleOrder.orderNumber}` : 'Create Glass Fabrication & Sale Order'}
        subtitle={
          editingSaleOrder
            ? 'Update payment status, payment mode, delivery address, or line items'
            : 'Select an Invoice to auto-fetch details, or create a direct glass order'
        }
        maxWidth="max-w-3xl"
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

          {/* Header Row: Invoice Selection & Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                disabled={isOrderDelivered}
                className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 bg-white focus:outline-none focus:ring-1 focus:ring-edge-600 disabled:bg-steel-100 disabled:text-steel-500"
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
              <label htmlFor="sale-order-customer" className="block text-xs font-semibold text-steel-700 mb-1">Customer / Project *</label>
              <select
                id="sale-order-customer"
                name="customerId"
                required
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                disabled={isOrderDelivered || Boolean(formData.quotationId)}
                className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 bg-white focus:outline-none focus:ring-1 focus:ring-edge-600 disabled:bg-steel-100 disabled:text-steel-600"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName ? `${c.companyName} (${c.name})` : c.name}
                  </option>
                ))}
              </select>
              {formData.quotationId && (
                <p className="text-[11px] text-steel-500 mt-1">
                  Customer locked to selected invoice.
                </p>
              )}
            </div>
          </div>

          {/* Payment & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-steel-50/70 p-3 rounded-lg border border-steel-200">
            <div>
              <label htmlFor="sale-order-payment-mode" className="block text-xs font-semibold text-steel-700 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Mode of Payment *</span>
              </label>
              <select
                id="sale-order-payment-mode"
                name="paymentMode"
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 bg-white focus:outline-none focus:ring-1 focus:ring-edge-600 font-medium"
              >
                <option value="CASH">Cash</option>
                <option value="ONLINE">NEFT / UPI / Card</option>
              </select>
            </div>

            <div>
              <label htmlFor="sale-order-payment-status" className="block text-xs font-semibold text-steel-700 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Payment Status *</span>
              </label>
              <select
                id="sale-order-payment-status"
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 bg-white focus:outline-none focus:ring-1 focus:ring-edge-600 font-medium"
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial Payment</option>
                <option value="PAID">Paid in Full</option>
              </select>
            </div>

            <div>
              <label htmlFor="sale-order-fulfillment-status" className="block text-xs font-semibold text-steel-700 mb-1">Fulfillment Status *</label>
              <select
                id="sale-order-fulfillment-status"
                name="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={isOrderDelivered}
                className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 bg-white focus:outline-none focus:ring-1 focus:ring-edge-600 disabled:bg-steel-100 disabled:text-steel-600"
              >
                <option value="PENDING">Pending Production</option>
                <option value="IN_PRODUCTION">In Processing</option>
                <option value="READY">Ready for Dispatch</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <label htmlFor="sale-order-delivery-address" className="block text-xs font-semibold text-steel-700 mb-1">Delivery / Plant Site Address</label>
            <input
              id="sale-order-delivery-address"
              name="deliveryAddress"
              type="text"
              value={formData.deliveryAddress}
              onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              placeholder="e.g. Plot 14, Commercial Area, Hingna Road, Nagpur"
              className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600"
            />
          </div>

          {/* Items Section - Direct Editable Specification (No manual SKU dropdown) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-steel-700">Glass Line Items</span>
                {isOrderDelivered && (
                  <span className="ml-2 text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <Lock className="w-3 h-3 inline mr-1" />
                    Fabrication items locked for delivered order
                  </span>
                )}
              </div>
              {!isOrderDelivered && (
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-edge-700 bg-edge-50 hover:bg-edge-100 border border-edge-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              )}
            </div>

            <div className="border border-steel-200 rounded-lg overflow-x-auto p-2 bg-steel-50/50">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[11px] font-semibold text-steel-500 uppercase border-b border-steel-200 pb-1">
                    <th className="text-left pb-1.5">Glass Item / Specification</th>
                    <th className="text-center pb-1.5 w-20">Qty</th>
                    <th className="text-right pb-1.5 w-28">Rate (₹)</th>
                    <th className="text-right pb-1.5 w-28">Total (₹)</th>
                    {!isOrderDelivered && <th className="w-8"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-100">
                  {formData.items.map((item, idx) => (
                    <tr key={idx} className="align-middle">
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          required
                          disabled={isOrderDelivered}
                          aria-label={`Item ${idx + 1} specification`}
                          value={item.description || ''}
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                          placeholder="e.g. 12mm Clear Toughened Glass (57&quot; × 44&quot;)"
                          className="w-full p-1.5 rounded border border-steel-300 text-xs text-steel-900 bg-white focus:outline-none focus:ring-1 focus:ring-edge-600 disabled:bg-steel-100 disabled:text-steel-600"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <input
                          type="number"
                          min="1"
                          required
                          disabled={isOrderDelivered}
                          aria-label={`Item ${idx + 1} quantity`}
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                          className="w-full p-1.5 rounded border border-steel-300 text-xs text-center font-mono focus:outline-none focus:ring-1 focus:ring-edge-600 disabled:bg-steel-100 disabled:text-steel-600"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          disabled={isOrderDelivered}
                          aria-label={`Item ${idx + 1} rate in rupees`}
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                          className="w-full p-1.5 rounded border border-steel-300 text-xs text-right font-mono focus:outline-none focus:ring-1 focus:ring-edge-600 disabled:bg-steel-100 disabled:text-steel-600"
                        />
                      </td>
                      <td className="py-2 pl-2 text-right font-mono font-bold text-steel-900">
                        ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      {!isOrderDelivered && (
                        <td className="py-2 pl-1 text-center">
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-steel-400 hover:text-rose-600 p-1"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Amount Preview */}
          <div className="flex justify-between items-center bg-steel-50 p-3 rounded-lg border border-steel-200 font-mono text-xs">
            <span className="font-semibold text-steel-700">Order Total Amount:</span>
            <span className="text-sm font-bold text-edge-700">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-steel-200">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingSaleOrder(null);
              }}
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-steel-700 bg-white border border-steel-300 hover:bg-steel-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSubmitting
                ? (editingSaleOrder ? 'Saving Changes...' : 'Registering...')
                : (editingSaleOrder ? 'Save Order Changes' : 'Create Sales Order')
              }
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SalesView;
