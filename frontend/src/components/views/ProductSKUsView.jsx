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
      alert(`Failed to save SKU: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'SKU Code',
      accessor: 'skuCode',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-edge-800 bg-edge-50 px-2 py-0.5 rounded border border-edge-200">
          {row.skuCode}
        </span>
      )
    },
    {
      header: 'Product Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <span className="font-semibold text-steel-900">{row.name}</span>
          {row.description && (
            <span className="block text-[11px] text-steel-500 font-normal">{row.description}</span>
          )}
        </div>
      )
    },
    {
      header: 'Glass Category',
      accessor: 'glassType',
      render: (row) => (
        <span className="inline-flex items-center text-[11px] font-medium text-steel-700 bg-steel-100 px-2 py-0.5 rounded border border-steel-200">
          {row.glassType}
        </span>
      )
    },
    {
      header: 'Thickness',
      accessor: 'thicknessMm',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-steel-800">
          {Number(row.thicknessMm)} mm
        </span>
      )
    },
    {
      header: 'Unit Basis',
      accessor: 'unitOfMeasure',
      render: (row) => {
        const match = UNITS_OF_MEASURE.find(u => u.value === row.unitOfMeasure);
        return <span className="text-xs text-steel-600 font-medium">{match ? match.label : row.unitOfMeasure}</span>;
      }
    },
    {
      header: 'Base Rate',
      accessor: 'unitPrice',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-steel-900">
          ₹{Number(row.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Top Filter & Actions */}
      <div className="bg-white rounded-lg border border-steel-200 p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider mr-1 shrink-0">Glass:</span>
          {GLASS_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedGlassType(t)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedGlassType === t
                  ? 'filter-pill-active bg-slate-900 text-white font-semibold shadow-xs'
                  : 'filter-pill-inactive text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {t === 'ALL' ? 'All Glass' : t}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
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
            className="btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
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
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-steel-700 mb-1">SKU Code *</label>
              <input
                type="text"
                required
                value={formData.skuCode}
                onChange={(e) => setFormData({ ...formData, skuCode: e.target.value.toUpperCase() })}
                placeholder="e.g. GL-TOUGH-10MM"
                className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 font-mono text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-steel-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. 10mm Clear Toughened Glass"
                className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-steel-700 mb-1">Glass Type *</label>
              <select
                required
                value={formData.glassType}
                onChange={(e) => setFormData({ ...formData, glassType: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 bg-white focus:outline-none focus:ring-1 focus:ring-edge-600"
              >
                {GLASS_TYPES.filter(t => t !== 'ALL').map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-steel-700 mb-1">Nominal Thickness (mm) *</label>
              <input
                type="number"
                step="0.1"
                min="1"
                required
                value={formData.thicknessMm}
                onChange={(e) => setFormData({ ...formData, thicknessMm: e.target.value })}
                placeholder="e.g. 10 or 12"
                className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 font-mono text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-steel-700 mb-1">Unit of Measure *</label>
              <select
                required
                value={formData.unitOfMeasure}
                onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 bg-white focus:outline-none focus:ring-1 focus:ring-edge-600"
              >
                {UNITS_OF_MEASURE.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-steel-700 mb-1">Unit Base Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                placeholder="e.g. 1850.00"
                className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 font-mono text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-steel-700 mb-1">Description / Technical Notes</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Edge finishing requirements, acoustic rating, solar heat gain coefficient..."
              className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600"
            />
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
              {isSubmitting ? 'Saving...' : 'Add SKU to Catalog'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductSKUsView;
