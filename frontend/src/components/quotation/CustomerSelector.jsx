import React, { useState } from 'react';
import { User, Building, Plus } from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

export default function CustomerSelector({
  customers = [],
  selectedCustomerId,
  onSelectCustomer,
  onAddNewCustomer,
}) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [customerType, setCustomerType] = useState('ORGANIZATION');
  const [newCust, setNewCust] = useState({
    name: '',
    companyName: '',
    gstin: '',
    phone: '',
    email: '',
    billingAddress: '',
  });

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCust.name || !newCust.phone) return;
    const created = await onAddNewCustomer({
      ...newCust,
      type: customerType,
    });
    if (created) {
      onSelectCustomer(created.id);
      setIsAddingNew(false);
      setNewCust({
        name: '',
        companyName: '',
        gstin: '',
        phone: '',
        email: '',
        billingAddress: '',
      });
    }
  };

  if (isAddingNew) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 border border-sky-200 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-sky-700 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Register Client Account
          </span>
          <button
            type="button"
            onClick={() => setIsAddingNew(false)}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Cancel
          </button>
        </div>

        {/* Client Type Toggle */}
        <div className="flex gap-2 p-1 rounded-lg bg-slate-200/60 border border-slate-300 w-fit">
          <button
            type="button"
            onClick={() => setCustomerType('ORGANIZATION')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              customerType === 'ORGANIZATION'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" /> Organization / Contractor
          </button>
          <button
            type="button"
            onClick={() => setCustomerType('INDIVIDUAL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              customerType === 'INDIVIDUAL'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Individual Client
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={customerType === 'ORGANIZATION' ? 'Contact Representative Name' : 'Full Name'}
            placeholder="e.g. Vikram Sharma"
            required
            value={newCust.name}
            onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
          />

          {customerType === 'ORGANIZATION' && (
            <Input
              label="Company / Firm Name"
              placeholder="e.g. Apex Glass & Façades Pvt Ltd"
              required
              value={newCust.companyName}
              onChange={(e) => setNewCust({ ...newCust, companyName: e.target.value })}
            />
          )}

          {customerType === 'ORGANIZATION' && (
            <Input
              label="Tax ID / GSTIN"
              placeholder="e.g. 27AABCA1234F1Z9"
              value={newCust.gstin}
              onChange={(e) => setNewCust({ ...newCust, gstin: e.target.value })}
            />
          )}

          <Input
            label="Phone Number"
            placeholder="+91 98765 43210"
            required
            value={newCust.phone}
            onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
          />

          <Input
            label="Email Address"
            placeholder="client@example.in"
            value={newCust.email}
            onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
          />

          <Input
            label="Site / Billing Address"
            placeholder="e.g. 401 Skylark Tower, Senapati Bapat Marg, Lower Parel, Mumbai 400013"
            value={newCust.billingAddress}
            onChange={(e) => setNewCust({ ...newCust, billingAddress: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button size="sm" variant="ghost" onClick={() => setIsAddingNew(false)}>
            Back to Selection
          </Button>
          <Button size="sm" variant="primary" onClick={handleCreateCustomer}>
            Save & Select Client
          </Button>
        </div>
      </div>
    );
  }

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: `${c.companyName ? `${c.companyName} (${c.name})` : c.name} - ${c.type}`,
  }));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-700">
          Client Account (Individual / Organization) <span className="text-rose-500">*</span>
        </label>
        <button
          type="button"
          onClick={() => setIsAddingNew(true)}
          className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1 font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> + New Customer
        </button>
      </div>
      <Select
        placeholder="Select customer account..."
        value={selectedCustomerId || ''}
        onChange={(e) => onSelectCustomer(e.target.value)}
        options={customerOptions}
        required
      />
    </div>
  );
}
