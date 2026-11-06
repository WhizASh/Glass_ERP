import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { GLASS_TYPES, STANDARD_THICKNESSES } from '../../utils/glassMath';

const CATEGORIES = [
  { value: 'FLOAT_SHEET', label: 'Float Glass Sheets (Stock Packs)' },
  { value: 'RAW_MATERIAL', label: 'Raw Interlayers & Chemicals (PVB, Desiccant)' },
  { value: 'FINISHED_GLASS', label: 'Finished Stock / Pre-cut Panes' },
  { value: 'HARDWARE_FITTINGS', label: 'Hardware & Spacers' },
  { value: 'CONSUMABLE', label: 'Consumables & Sealants' },
];

const UOM_OPTIONS = ['Sheets', 'Kg', 'Sqm', 'Units', 'Packs', 'Boxes', 'Liters'];

const STANDARD_SHEET_SIZES = [
  { label: 'Jumbo Size (3210 × 2250 mm)', width: 3210, height: 2250 },
  { label: 'Standard Architectural (2440 × 1830 mm)', width: 2440, height: 1830 },
  { label: 'Oversize (3660 × 2440 mm)', width: 3660, height: 2440 },
  { label: 'Custom Dimensions', width: '', height: '' },
];

export default function AddEditItemModal({
  isOpen,
  onClose,
  initialData,
  onSave,
}) {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'FLOAT_SHEET',
    glassType: 'ANNEALED_FLOAT',
    thicknessMm: 6,
    widthMm: 3210,
    heightMm: 2250,
    stockQuantity: 10,
    unitOfMeasure: 'Sheets',
    reorderLevel: 5,
    unitCost: 140,
    unitPrice: 220,
    rackLocation: 'Rack A-01',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        thicknessMm: initialData.thicknessMm || 6,
        widthMm: initialData.widthMm || 3210,
        heightMm: initialData.heightMm || 2250,
      });
    } else {
      setFormData({
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        name: '',
        category: 'FLOAT_SHEET',
        glassType: 'ANNEALED_FLOAT',
        thicknessMm: 6,
        widthMm: 3210,
        heightMm: 2250,
        stockQuantity: 10,
        unitOfMeasure: 'Sheets',
        reorderLevel: 5,
        unitCost: 140,
        unitPrice: 220,
        rackLocation: 'Rack A-01',
      });
    }
  }, [initialData, isOpen]);

  const handleStandardSizeSelect = (e) => {
    const val = e.target.value;
    const found = STANDARD_SHEET_SIZES.find((s) => s.label === val);
    if (found && found.width) {
      setFormData((prev) => ({
        ...prev,
        widthMm: found.width,
        heightMm: found.height,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter an item name');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isGlass = formData.category === 'FLOAT_SHEET' || formData.category === 'FINISHED_GLASS';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Edit Inventory SKU: ${initialData.sku}` : 'Add Inventory Catalog Item'}
      subtitle="Warehouse master registry & A-frame placement"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SKU, Name & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="SKU / Barcode"
            required
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          />
          <div className="sm:col-span-2">
            <Input
              label="Item Name / Description"
              placeholder="e.g. Clear Float Glass 10mm"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={CATEGORIES}
          />
          <Input
            label="Warehouse Rack / A-Frame Location"
            placeholder="e.g. Rack A-04 or Bay 3"
            value={formData.rackLocation || ''}
            onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
          />
        </div>

        {/* Glass Specs (if applicable) */}
        {isGlass && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-700">Glass Dimensions & Specs</span>
              <select
                onChange={handleStandardSizeSelect}
                className="text-[11px] bg-white border border-slate-300 rounded px-2 py-1 text-slate-700"
              >
                <option value="">Standard Sheet Preset...</option>
                {STANDARD_SHEET_SIZES.map((s, idx) => (
                  <option key={idx} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Glass Grade"
                value={formData.glassType || 'ANNEALED_FLOAT'}
                onChange={(e) => setFormData({ ...formData, glassType: e.target.value })}
                options={GLASS_TYPES.map((g) => ({ value: g.id, label: g.label }))}
              />
              <Select
                label="Thickness"
                value={formData.thicknessMm || 6}
                onChange={(e) => setFormData({ ...formData, thicknessMm: Number(e.target.value) })}
                options={STANDARD_THICKNESSES.map((t) => ({ value: t, label: `${t} mm` }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Width (mm)"
                  type="number"
                  value={formData.widthMm || ''}
                  onChange={(e) => setFormData({ ...formData, widthMm: Number(e.target.value) })}
                />
                <Input
                  label="Height (mm)"
                  type="number"
                  value={formData.heightMm || ''}
                  onChange={(e) => setFormData({ ...formData, heightMm: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Quantities, Unit, and Thresholds */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Initial Stock Quantity"
            type="number"
            min="0"
            step="any"
            required
            value={formData.stockQuantity}
            onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
          />
          <Select
            label="Unit of Measure"
            value={formData.unitOfMeasure}
            onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
            options={UOM_OPTIONS}
          />
          <Input
            label="Low-Stock Reorder Level"
            type="number"
            min="0"
            required
            value={formData.reorderLevel}
            onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
          />
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Unit Procurement Cost (₹)"
            type="number"
            min="0"
            step="0.01"
            required
            value={formData.unitCost}
            onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
          />
          <Input
            label="Base Selling Price (₹)"
            type="number"
            min="0"
            step="0.01"
            required
            value={formData.unitPrice}
            onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {initialData ? 'Update Catalog Item' : 'Add to Inventory'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
