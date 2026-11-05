import React, { useState, useEffect } from 'react';
import { User, Building } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

export default function CustomerFormModal({
  isOpen,
  onClose,
  initialData,
  onSaveCustomer,
}) {
  const [formData, setFormData] = useState({
    type: 'ORGANIZATION',
    name: '',
    companyName: '',
    gstin: '',
    phone: '',
    email: '',
    billingAddress: '',
    shippingAddress: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      setFormData({
        type: 'ORGANIZATION',
        name: '',
        companyName: '',
        gstin: '',
        phone: '',
        email: '',
        billingAddress: '',
        shippingAddress: '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Please fill out the contact name and phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveCustomer(formData);
      onClose();
    } catch (err) {
      console.error('Failed to save customer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Customer Account' : 'Register New Client Account'}
      subtitle="Architectural firms, contractors, and individual glazing clients"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type toggle */}
        <div className="flex gap-2 p-1 rounded-lg bg-slate-100 border border-slate-200 w-fit">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'ORGANIZATION' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              formData.type === 'ORGANIZATION'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" /> Organization / Firm
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'INDIVIDUAL' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              formData.type === 'INDIVIDUAL'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Individual Client
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={formData.type === 'ORGANIZATION' ? 'Contact Representative' : 'Full Name'}
            placeholder="e.g. Marcus Wright"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          {formData.type === 'ORGANIZATION' && (
            <Input
              label="Company / Firm Name"
              placeholder="e.g. Skyline Facades LLC"
              required
              value={formData.companyName || ''}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
          )}

          {formData.type === 'ORGANIZATION' && (
            <Input
              label="Tax ID / GSTIN"
              placeholder="e.g. GST-US-8849201"
              value={formData.gstin || ''}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
            />
          )}

          <Input
            label="Phone Number"
            placeholder="+1 (555) 000-0000"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Input
            label="Email Address"
            placeholder="client@example.com"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="space-y-3">
          <Input
            label="Billing Address"
            placeholder="Commercial Suite, City, State"
            value={formData.billingAddress || ''}
            onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
          />
          <Input
            label="Delivery / Job Site Address"
            placeholder="Job site address or leave blank if same as billing"
            value={formData.shippingAddress || ''}
            onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Customer Account
          </Button>
        </div>
      </form>
    </Modal>
  );
}
