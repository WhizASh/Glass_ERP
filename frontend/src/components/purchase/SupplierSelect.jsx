import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Select from '../common/Select';
import Button from '../common/Button';
import Input from '../common/Input';

export default function SupplierSelect({
  suppliers = [],
  selectedSupplierId,
  onSelectSupplier,
  onAddNewSupplier,
}) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    taxId: '',
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newSupplier.name || !newSupplier.phone) return;
    const created = await onAddNewSupplier(newSupplier);
    if (created) {
      onSelectSupplier(created.id);
      setIsAddingNew(false);
      setNewSupplier({ name: '', contactPerson: '', phone: '', email: '', taxId: '' });
    }
  };

  if (isAddingNew) {
    return (
      <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-800/50 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Register New Glass / Material Supplier
          </span>
          <button
            type="button"
            onClick={() => setIsAddingNew(false)}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Supplier Company Name"
            placeholder="e.g. Saint-Gobain Glass"
            required
            value={newSupplier.name}
            onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
          />
          <Input
            label="Contact Person"
            placeholder="e.g. Marcus Vance"
            value={newSupplier.contactPerson}
            onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
          />
          <Input
            label="Phone Number"
            placeholder="+1 (555) 000-0000"
            required
            value={newSupplier.phone}
            onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
          />
          <Input
            label="Email"
            placeholder="orders@supplier.com"
            value={newSupplier.email}
            onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
          />
          <div className="sm:col-span-2">
            <Input
              label="Tax ID / GSTIN"
              placeholder="e.g. US-SG-994821"
              value={newSupplier.taxId}
              onChange={(e) => setNewSupplier({ ...newSupplier, taxId: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button size="sm" variant="ghost" onClick={() => setIsAddingNew(false)}>
            Back to List
          </Button>
          <Button size="sm" variant="primary" onClick={handleCreate}>
            Save & Select Supplier
          </Button>
        </div>
      </div>
    );
  }

  const supplierOptions = suppliers.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.contactPerson || s.phone})`,
  }));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-300">
          Raw Material Supplier / Manufacturer <span className="text-rose-400">*</span>
        </label>
        <button
          type="button"
          onClick={() => setIsAddingNew(true)}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> + New Supplier
        </button>
      </div>
      <Select
        placeholder="Select supplier..."
        value={selectedSupplierId || ''}
        onChange={(e) => onSelectSupplier(e.target.value)}
        options={supplierOptions}
        required
      />
    </div>
  );
}
