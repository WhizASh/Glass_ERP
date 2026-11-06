import React, { useState, useEffect } from 'react';
import { FileText, Plus, Filter, Trash2, Layers, Calendar } from 'lucide-react';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { api } from '../../services/api';

const STATUS_FILTERS = ['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'CANCELLED'];

const QuotationsView = () => {
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Quotation Form with hierarchical sections
  const [formData, setFormData] = useState({
    customerId: '',
    validUntil: '',
    taxRate: 18,
    notes: '',
    sections: [
      {
        sectionName: '1st Floor Partitions',
        items: [
          { productSkuId: '', description: '', widthMm: '', heightMm: '', quantity: 1, unitPrice: 0 }
        ]
      }
    ]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQuotations = () => {
    setLoading(true);
    const params = {};
    if (selectedStatus !== 'ALL') params.status = selectedStatus;

    api.getQuotations(params)
      .then((data) => {
        setQuotations(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.warn('Quotations fetch notice:', err.message);
        setQuotations([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuotations();
  }, [selectedStatus]);

  useEffect(() => {
    // Load customers and products for quotation builder
    api.getCustomers().then(data => setCustomers(Array.isArray(data) ? data : [])).catch(() => {});
    api.getProducts().then(data => setProducts(Array.isArray(data) ? data : [])).catch(() => {});
  }, [isModalOpen]);

  // Section manipulation
  const addSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          sectionName: `Section ${prev.sections.length + 1}`,
          items: [{ productSkuId: '', description: '', widthMm: '', heightMm: '', quantity: 1, unitPrice: 0 }]
        }
      ]
    }));
  };

  const removeSection = (sectionIndex) => {
    if (formData.sections.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== sectionIndex)
    }));
  };

  const updateSectionName = (sectionIndex, name) => {
    setFormData(prev => {
      const updated = [...prev.sections];
      updated[sectionIndex].sectionName = name;
      return { ...prev, sections: updated };
    });
  };

  // Item manipulation within section
  const addItemToSection = (sectionIndex) => {
    setFormData(prev => {
      const updated = [...prev.sections];
      updated[sectionIndex].items.push({
        productSkuId: '',
        description: '',
        widthMm: '',
        heightMm: '',
        quantity: 1,
        unitPrice: 0
      });
      return { ...prev, sections: updated };
    });
  };

  const removeItemFromSection = (sectionIndex, itemIndex) => {
    setFormData(prev => {
      const updated = [...prev.sections];
      if (updated[sectionIndex].items.length <= 1) return prev;
      updated[sectionIndex].items = updated[sectionIndex].items.filter((_, idx) => idx !== itemIndex);
      return { ...prev, sections: updated };
    });
  };

  const updateItemField = (sectionIndex, itemIndex, field, value) => {
    setFormData(prev => {
      const updated = [...prev.sections];
      const currentItem = { ...updated[sectionIndex].items[itemIndex], [field]: value };

      // Auto-set unit price when product sku is chosen
      if (field === 'productSkuId') {
        const prod = products.find(p => p.id === value);
        if (prod) {
          currentItem.unitPrice = prod.unitPrice;
          currentItem.description = `${prod.name} (${prod.thicknessMm}mm)`;
        }
      }

      updated[sectionIndex].items[itemIndex] = currentItem;
      return { ...prev, sections: updated };
    });
  };

  // Calculations
  const calculateTotals = () => {
    let subtotal = 0;
    formData.sections.forEach(sec => {
      sec.items.forEach(item => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        subtotal += qty * price;
      });
    });
    const taxRate = parseFloat(formData.taxRate) || 0;
    const tax = (subtotal * taxRate) / 100;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId) {
      alert('Please select a customer for this quotation.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createQuotation(formData);
      setIsModalOpen(false);
      // Reset form
      setFormData({
        customerId: '',
        validUntil: '',
        taxRate: 18,
        notes: '',
        sections: [
          {
            sectionName: '1st Floor Partitions',
            items: [
              { productSkuId: '', description: '', widthMm: '', heightMm: '', quantity: 1, unitPrice: 0 }
            ]
          }
        ]
      });
      fetchQuotations();
    } catch (err) {
      alert(`Failed to create quotation: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Quote #',
      accessor: 'quoteNumber',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-md border border-blue-200/60">
          {row.quoteNumber}
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
          {row.customer?.companyName && (
            <span className="block text-xs text-slate-400">
              {row.customer.name}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Date',
      accessor: 'issueDate',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row.issueDate ? new Date(row.issueDate).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      header: 'Sections',
      accessor: 'sections',
      render: (row) => {
        const count = row.sections?.length || 0;
        return (
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            {count} {count === 1 ? 'Section' : 'Sections'}
          </span>
        );
      }
    },
    {
      header: 'Status',
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
      {/* Filters & Actions */}
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
              {s === 'ALL' ? 'All Quotes' : s}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation</span>
        </button>
      </div>

      {/* Quotations Table */}
      <DataTable
        columns={columns}
        data={quotations}
        tableAriaLabel="Quotations Table"
        emptyMessage="No quotations generated yet"
        emptySubtext="Draft multi-section glass quotes for commercial or residential architectural projects."
        actionButton={
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Quotation</span>
          </button>
        }
      />

      {/* New Quotation Modal (with Sections) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Glass Quotation"
        subtitle="Organize quotation items into floor/area sections (e.g. 1st Floor, 2nd Floor)"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Select Customer *</label>
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
              {customers.length === 0 && (
                <p className="text-[11px] text-amber-600 mt-1">Please add a customer in the Customers tab first.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Valid Until</label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl glass-input"
              />
            </div>
          </div>

          {/* Sections Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Quotation Sections & Glass Line Items</span>
              </h3>
              <button
                type="button"
                onClick={addSection}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Section</span>
              </button>
            </div>

            {formData.sections.map((section, sIdx) => (
              <div
                key={sIdx}
                className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 space-y-3"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      #{sIdx + 1}
                    </span>
                    <input
                      type="text"
                      required
                      value={section.sectionName}
                      onChange={(e) => updateSectionName(sIdx, e.target.value)}
                      placeholder="Section Name (e.g. Ground Floor Facade, 1st Floor)"
                      className="text-xs font-bold text-slate-800 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200 w-full max-w-xs glass-input"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => addItemToSection(sIdx)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item</span>
                    </button>
                    {formData.sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSection(sIdx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                        title="Delete section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Items Table within Section */}
                <div className="overflow-x-auto bg-white/70 rounded-xl border border-slate-200/80 p-2">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 font-semibold border-b border-slate-100">
                        <th className="text-left pb-2">Glass Product SKU</th>
                        <th className="text-left pb-2 w-20">Width (mm)</th>
                        <th className="text-left pb-2 w-20">Height (mm)</th>
                        <th className="text-center pb-2 w-16">Qty</th>
                        <th className="text-right pb-2 w-24">Unit Price ($)</th>
                        <th className="text-right pb-2 w-24">Total</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {section.items.map((item, iIdx) => {
                        const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);

                        return (
                          <tr key={iIdx} className="align-middle">
                            <td className="py-2 pr-2">
                              <select
                                required
                                value={item.productSkuId}
                                onChange={(e) => updateItemField(sIdx, iIdx, 'productSkuId', e.target.value)}
                                className="w-full p-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                              >
                                <option value="">-- Choose Glass SKU --</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.skuCode} - {p.name} (${Number(p.unitPrice).toFixed(2)})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-1">
                              <input
                                type="number"
                                placeholder="W"
                                value={item.widthMm}
                                onChange={(e) => updateItemField(sIdx, iIdx, 'widthMm', e.target.value)}
                                className="w-full p-1.5 rounded-lg border border-slate-200 text-xs text-center"
                              />
                            </td>
                            <td className="py-2 px-1">
                              <input
                                type="number"
                                placeholder="H"
                                value={item.heightMm}
                                onChange={(e) => updateItemField(sIdx, iIdx, 'heightMm', e.target.value)}
                                className="w-full p-1.5 rounded-lg border border-slate-200 text-xs text-center"
                              />
                            </td>
                            <td className="py-2 px-1">
                              <input
                                type="number"
                                min="1"
                                required
                                value={item.quantity}
                                onChange={(e) => updateItemField(sIdx, iIdx, 'quantity', e.target.value)}
                                className="w-full p-1.5 rounded-lg border border-slate-200 text-xs text-center font-medium"
                              />
                            </td>
                            <td className="py-2 px-1">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={item.unitPrice}
                                onChange={(e) => updateItemField(sIdx, iIdx, 'unitPrice', e.target.value)}
                                className="w-full p-1.5 rounded-lg border border-slate-200 text-xs text-right font-medium"
                              />
                            </td>
                            <td className="py-2 pl-2 text-right font-bold text-slate-800">
                              ${itemTotal.toFixed(2)}
                            </td>
                            <td className="py-2 pl-1 text-center">
                              {section.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeItemFromSection(sIdx, iIdx)}
                                  className="text-slate-300 hover:text-rose-500 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Quotation Summary Totals */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex flex-col items-end space-y-1 text-xs">
            <div className="flex justify-between w-48 text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-48 text-slate-600">
              <span>Tax ({formData.taxRate}%):</span>
              <span className="font-semibold">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-48 text-slate-800 text-sm font-bold pt-1 border-t border-slate-200">
              <span>Grand Total:</span>
              <span className="text-blue-600">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Quotation Notes / Terms</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Validity period, payment terms, delivery schedule..."
              className="w-full px-3 py-2 text-sm rounded-xl glass-input"
            />
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
              {isSubmitting ? 'Creating...' : 'Create Quotation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QuotationsView;
