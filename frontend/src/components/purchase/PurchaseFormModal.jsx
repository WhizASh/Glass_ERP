import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import SupplierSelect from './SupplierSelect';
import { formatCurrency } from '../../utils/formatters';

const CATEGORIES = [
  { value: 'FLOAT_SHEET', label: 'Float Glass Sheets (Packs/Crater)' },
  { value: 'RAW_MATERIAL', label: 'Raw Interlayers & Chemicals (PVB, Desiccant)' },
  { value: 'HARDWARE_FITTINGS', label: 'Fittings & Spacers (Alu Spacers, Hinges)' },
  { value: 'CONSUMABLE', label: 'Consumables & Sealants (Silicone, Cutting Oil)' },
];

const UOM_OPTIONS = ['Sheets', 'Kg', 'Sqm', 'Units', 'Packs', 'Boxes'];

export default function PurchaseFormModal({
  isOpen,
  onClose,
  inventoryItems = [],
  suppliers = [],
  onSubmitPurchase,
  onAddNewSupplier,
}) {
  const [supplierId, setSupplierId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [customItemName, setCustomItemName] = useState('');
  const [category, setCategory] = useState('FLOAT_SHEET');
  const [quantity, setQuantity] = useState(10);
  const [unitOfMeasure, setUnitOfMeasure] = useState('Sheets');
  const [unitCost, setUnitCost] = useState(150);
  const [taxPercent, setTaxPercent] = useState(10);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync details when an existing inventory item is chosen
  useEffect(() => {
    if (selectedItemId && selectedItemId !== 'NEW_ITEM') {
      const found = inventoryItems.find((i) => i.id === selectedItemId);
      if (found) {
        setCustomItemName(found.name);
        setCategory(found.category);
        setUnitOfMeasure(found.unitOfMeasure);
        setUnitCost(found.unitCost || 0);
      }
    } else if (selectedItemId === 'NEW_ITEM') {
      setCustomItemName('');
    }
  }, [selectedItemId, inventoryItems]);

  const subtotal = Number(quantity || 0) * Number(unitCost || 0);
  const taxAmount = (subtotal * Number(taxPercent || 0)) / 100;
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      alert('Please select a supplier');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemName =
        selectedItemId && selectedItemId !== 'NEW_ITEM'
          ? inventoryItems.find((i) => i.id === selectedItemId)?.name
          : customItemName;

      await onSubmitPurchase({
        supplierId,
        totalAmount,
        notes,
        items: [
          {
            itemId: selectedItemId === 'NEW_ITEM' ? null : selectedItemId,
            itemName,
            category,
            quantity: Number(quantity),
            unitOfMeasure,
            unitCost: Number(unitCost),
            totalCost: subtotal,
          },
        ],
      });
      onClose();
    } catch (err) {
      console.error('Error recording purchase:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const itemOptions = [
    { value: 'NEW_ITEM', label: '+ Create / Record Unlisted Product' },
    ...inventoryItems.map((item) => ({
      value: item.id,
      label: `${item.sku} - ${item.name} (${item.stockQuantity} in stock)`,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Raw Material Purchase"
      subtitle="Inward delivery receipt and warehouse inventory restocking"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Supplier Selection */}
        <SupplierSelect
          suppliers={suppliers}
          selectedSupplierId={supplierId}
          onSelectSupplier={setSupplierId}
          onAddNewSupplier={onAddNewSupplier}
        />

        {/* Existing Item or Custom Item */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Restock Existing Inventory Item"
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            options={itemOptions}
            placeholder="Select catalog item or record new..."
          />
          <Select
            label="Material Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={CATEGORIES}
          />
        </div>

        {selectedItemId === 'NEW_ITEM' && (
          <Input
            label="New Product / Material Name"
            placeholder="e.g. 19mm Extra Clear Low-Iron Float Glass"
            required
            value={customItemName}
            onChange={(e) => setCustomItemName(e.target.value)}
          />
        )}

        {/* Quantities & Costs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Quantity Received"
            type="number"
            min="1"
            step="any"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <Select
            label="Unit of Measure (UOM)"
            value={unitOfMeasure}
            onChange={(e) => setUnitOfMeasure(e.target.value)}
            options={UOM_OPTIONS}
          />
          <Input
            label="Unit Purchase Cost"
            type="number"
            min="0"
            step="0.01"
            required
            suffix="₹"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
          />
        </div>

        {/* Taxes & Calculation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Applicable Tax Rate"
            type="number"
            min="0"
            max="100"
            suffix="%"
            value={taxPercent}
            onChange={(e) => setTaxPercent(e.target.value)}
          />
          <Input
            label="Supplier Invoice / Delivery Note #"
            placeholder="e.g. INV/2026-27/0842"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Live Calculation Preview Banner */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-600 font-medium">Net Calculated Inward Value</span>
            <div className="text-xs text-slate-500 mt-0.5">
              Subtotal: {formatCurrency(subtotal)} + Tax ({taxPercent}%): {formatCurrency(taxAmount)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-emerald-600 font-mono">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Confirm & Restock Inventory
          </Button>
        </div>
      </form>
    </Modal>
  );
}
