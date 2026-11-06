import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Filter, Trash2 } from 'lucide-react';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { api } from '../../services/api';

const STATUS_FILTERS = ['ALL', 'PENDING', 'IN_PRODUCTION', 'READY', 'DELIVERED', 'CANCELLED'];

const SalesView = () => {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    customerId: '',
    quotationId: '',
    deliveryAddress: '',
    items: [
      { productSkuId: '', description: '', widthMm: '', heightMm: '', quantity: 1, unitPrice: 0 }
    ]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    api.getProducts().then(data => setProducts(Array.isArray(data) ? data : [])).catch(() => {});
    api.getQuotations().then(data => setQuotations(Array.isArray(data) ? data : [])).catch(() => {});
  }, [isModalOpen]);

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
      const item = { ...updated[index], [field]: value };
      if (field === 'productSkuId') {
        const prod = products.find(p => p.id === value);
        if (prod) {
          item.unitPrice = prod.unitPrice;
          item.description = `${prod.name} (${prod.thicknessMm}mm)`;
        }
      }
      updated[index] = item;
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
      alert('Please choose a customer.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createSale(formData);
      setIsModalOpen(false);
      setFormData({
        customerId: '',
        quotationId: '',
        deliveryAddress: '',
        items: [
          { productSkuId: '', description: '', widthMm: '', heightMm: '', quantity: 1, unitPrice: 0 }
        ]
      });
      fetchSales();
    } catch (err) {
      alert(`Failed to create sale order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Order #',
      accessor: 'orderNumber',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-md border border-blue-200/60">
          {row.orderNumber}
        </span>
      )
    },
    {
      header: 'Customer',
      accessor: 'customer',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-800">
            {row.customer?.companyName || row.customer?.name || '—'}
          </span>
          {row.quotation?.quoteNumber && (
            <span className="block text-xs text-blue-600 font-mono">
              Quote: {row.quotation.quoteNumber}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Order Date',
      accessor: 'orderDate',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row.orderDate ? new Date(row.orderDate).toLocaleDateString() : '—'}
        </span>
      )
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
        <span className="text-sm font-bold text-slate-800">
          ${Number(row.totalAmount).toFixed(2)}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-500 uppercase mr-1 shrink-0">Status:</span>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedStatus === s
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'glass-button text-slate-600 hover:text-slate-800'
              }`}
            >
              {s === 'ALL' ? 'All Orders' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Sale Order</span>
        </button>
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={sales}
        tableAriaLabel="Sales Orders Table"
        emptyMessage="No sales orders recorded yet"
        emptySubtext="Convert approved quotations or create direct glass sales orders."
        actionButton={
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Sale Order</span>
          </button>
        }
      />

      {/* New Sale Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Sale Order"
        subtitle="Register order fulfillment and delivery tracking"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Customer *</label>
              <select
                required
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl glass-input"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName ? `${c.companyName} (${c.name})` : c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Linked Quotation (Optional)</label>
              <select
                value={formData.quotationId}
                onChange={(e) => setFormData({ ...formData, quotationId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl glass-input"
              >
                <option value="">-- None (Direct Order) --</option>
                {quotations.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.quoteNumber} - ${Number(q.totalAmount).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Delivery / Site Address</label>
            <input
              type="text"
              value={formData.deliveryAddress}
              onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              placeholder="e.g. 104 Construction Way, Site Gate 3"
              className="w-full px-3 py-2 text-sm rounded-xl glass-input"
            />
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Order Items</span>
              <button
                type="button"
                onClick={addItem}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 bg-slate-50/60 p-3 rounded-xl border border-slate-200">
              {formData.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <select
                      required
                      value={item.productSkuId}
                      onChange={(e) => updateItem(idx, 'productSkuId', e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    >
                      <option value="">-- Choose Glass SKU --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.skuCode} - {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Price"
                      step="0.01"
                      min="0"
                      required
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 text-xs text-right"
                    />
                  </div>
                  <div className="col-span-2 text-right font-bold text-xs text-slate-800">
                    ${((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}
                  </div>
                  <div className="col-span-1 text-center">
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-slate-300 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-right text-xs font-semibold text-slate-700">
              Total Order Value: <span className="text-blue-600 text-sm font-bold ml-1">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 disabled:opacity-60"
            >
              {isSubmitting ? 'Creating...' : 'Create Sale Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SalesView;
