import React, { useState, useEffect } from 'react';
import { Layers, Plus, Filter, Tag } from 'lucide-react';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import { api } from '../../services/api';

const GLASS_TYPES = ['ALL', 'Float Glass', 'Toughened Glass', 'Laminated Glass', 'DGU / Insulated', 'Tinted Glass', 'Frosted / Patterned'];
const UNITS_OF_MEASURE = [
  { value: 'SQ_METER', label: 'Square Meter (m²)' },
  { value: 'SQ_FEET', label: 'Square Feet (ft²)' },
  { value: 'KG', label: 'Kilogram (KG)' },
  { value: 'PCS', label: 'Piece (PCS)' }
];

const ProductSKUsView = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGlassType, setSelectedGlassType] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    skuCode: '',
    name: '',
    glassType: 'Float Glass',
    thicknessMm: '',
    unitOfMeasure: 'SQ_METER',
    unitPrice: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = () => {
    setLoading(true);
    const params = {};
    if (selectedGlassType !== 'ALL') params.glassType = selectedGlassType;

    api.getProducts(params)
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.warn('Products fetch notice:', err.message);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedGlassType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.skuCode || !formData.name || !formData.thicknessMm || !formData.unitPrice) return;

    setIsSubmitting(true);
    try {
      await api.createProduct(formData);
      setIsModalOpen(false);
      setFormData({
        skuCode: '',
        name: '',
        glassType: 'Float Glass',
        thicknessMm: '',
        unitOfMeasure: 'SQ_METER',
        unitPrice: '',
        description: ''
      });
      fetchProducts();
    } catch (err) {
      alert(`Failed to save product SKU: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'SKU Code',
      accessor: 'skuCode',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-md border border-blue-200/60">
          {row.skuCode}
        </span>
      )
    },
    {
      header: 'Product Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-800">{row.name}</span>
          {row.description && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{row.description}</p>
          )}
        </div>
      )
    },
    {
      header: 'Glass Type',
      accessor: 'glassType',
      render: (row) => (
        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
          {row.glassType}
        </span>
      )
    },
    {
      header: 'Thickness',
      accessor: 'thicknessMm',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-600">
          {row.thicknessMm} mm
        </span>
      )
    },
    {
      header: 'Unit',
      accessor: 'unitOfMeasure',
      render: (row) => {
        const match = UNITS_OF_MEASURE.find(u => u.value === row.unitOfMeasure);
        return <span className="text-xs text-slate-500 font-medium">{match ? match.label : row.unitOfMeasure}</span>;
      }
    },
    {
      header: 'Unit Price',
      accessor: 'unitPrice',
      align: 'right',
      render: (row) => (
        <span className="text-sm font-bold text-slate-800">
          ${Number(row.unitPrice).toFixed(2)}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter & Actions */}
      <div className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-500 uppercase mr-1 shrink-0">Glass Type:</span>
          <select
            value={selectedGlassType}
            onChange={(e) => setSelectedGlassType(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium glass-input text-slate-700"
          >
            {GLASS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === 'ALL' ? 'All Glass Types' : t}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product SKU</span>
        </button>
      </div>

      {/* Catalog Table */}
      <DataTable
        columns={columns}
        data={products}
        tableAriaLabel="Glass Product Catalog Table"
        emptyMessage="No product SKUs cataloged yet"
        emptySubtext="Define your glass specifications and base rates per unit (m², ft², KG, PCS)."
        actionButton={
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Product SKU</span>
          </button>
        }
      />

      {/* Add Product SKU Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Glass Product SKU"
        subtitle="Specify glass category, nominal thickness, unit of measure, and pricing"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">SKU Code *</label>
              <input
                type="text"
                required
                value={formData.skuCode}
                onChange={(e) => setFormData({ ...formData, skuCode: e.target.value.toUpperCase() })}
                placeholder="e.g. GL-TOUGH-10MM"
                className="w-full px-3 py-2 text-sm rounded-xl glass-input font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. 10mm Clear Toughened Glass"
                className="w-full px-3 py-2 text-sm rounded-xl glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Glass Type *</label>
              <select
                value={formData.glassType}
                onChange={(e) => setFormData({ ...formData, glassType: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl glass-input"
              >
                <option value="Float Glass">Float Glass</option>
                <option value="Toughened Glass">Toughened Glass</option>
                <option value="Laminated Glass">Laminated Glass</option>
                <option value="DGU / Insulated">DGU / Insulated</option>
                <option value="Tinted Glass">Tinted Glass</option>
                <option value="Frosted / Patterned">Frosted / Patterned</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Thickness (mm) *</label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                value={formData.thicknessMm}
                onChange={(e) => setFormData({ ...formData, thicknessMm: e.target.value })}
                placeholder="e.g. 10"
                className="w-full px-3 py-2 text-sm rounded-xl glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Unit of Measure *</label>
              <select
                value={formData.unitOfMeasure}
                onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl glass-input"
              >
                {UNITS_OF_MEASURE.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Base Unit Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                placeholder="e.g. 45.00"
                className="w-full px-3 py-2 text-sm rounded-xl glass-input font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description / Technical Notes</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Edge polishing, processing capabilities, application notes..."
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
              {isSubmitting ? 'Saving...' : 'Save Product SKU'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductSKUsView;
