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
      await api.createSale({
        ...formData,
        quotationId: formData.quotationId || null
      });
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
      alert(`Failed to save sale: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
              From Quote: {row.quotation.quoteNumber}
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
          onClick={() => setIsModalOpen(true)}
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
        emptySubtext="Convert approved quotations or create direct glass sales orders."
        actionButton={
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
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
        title="Create Glass Fabrication & Sale Order"
        subtitle="Register order fulfillment, production specs, and delivery tracking"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-steel-700 mb-1">Customer / Project *</label>
              <select
                required
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 bg-white focus:outline-none focus:ring-1 focus:ring-edge-600"
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
              <label className="block text-xs font-semibold text-steel-700 mb-1">Linked Quotation (Optional)</label>
              <select
                value={formData.quotationId}
                onChange={(e) => setFormData({ ...formData, quotationId: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 bg-white focus:outline-none focus:ring-1 focus:ring-edge-600"
              >
                <option value="">-- Direct Sale (No Quote) --</option>
                {quotations.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.quoteNumber} - ₹{Number(q.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({q.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-steel-700 mb-1">Delivery / Plant Site Address</label>
            <input
              type="text"
              value={formData.deliveryAddress}
              onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              placeholder="e.g. Plot 14, Okhla Phase III, Industrial Area, New Delhi"
              className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600"
            />
          </div>

          {/* Items Section */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-steel-700">Glass Line Items</span>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-edge-700 bg-edge-50 hover:bg-edge-100 border border-edge-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-steel-200 rounded-lg overflow-x-auto p-2 bg-steel-50/50">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[11px] font-semibold text-steel-500 uppercase border-b border-steel-200 pb-1">
                    <th className="text-left pb-1.5">Glass SKU</th>
                    <th className="text-center pb-1.5 w-16">Qty</th>
                    <th className="text-right pb-1.5 w-24">Rate (₹)</th>
                    <th className="text-right pb-1.5 w-24">Total (₹)</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-100">
                  {formData.items.map((item, idx) => (
                    <tr key={idx} className="align-middle">
                      <td className="py-2 pr-2">
                        <select
                          required
                          value={item.productSkuId}
                          onChange={(e) => updateItem(idx, 'productSkuId', e.target.value)}
                          className="w-full p-1.5 rounded border border-steel-300 text-xs bg-white text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600"
                        >
                          <option value="">-- Choose Glass SKU --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.skuCode} - {p.name} (₹{Number(p.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-1">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                          className="w-full p-1.5 rounded border border-steel-300 text-xs text-center font-mono focus:outline-none focus:ring-1 focus:ring-edge-600"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                          className="w-full p-1.5 rounded border border-steel-300 text-xs text-right font-mono focus:outline-none focus:ring-1 focus:ring-edge-600"
                        />
                      </td>
                      <td className="py-2 pl-2 text-right font-mono font-bold text-steel-900">
                        ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 pl-1 text-center">
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-steel-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center bg-steel-50 p-3 rounded-lg border border-steel-200 font-mono text-xs">
            <span className="font-semibold text-steel-700">Order Total Amount:</span>
            <span className="text-sm font-bold text-edge-700">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-steel-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-steel-700 bg-white border border-steel-300 hover:bg-steel-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSubmitting ? 'Registering...' : 'Create Sales Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SalesView;
