import { FilterTabs } from './PageLayout';
import Modal from './Modal';
import React, { useState } from 'react';
import { Phone, MapPin, FileText, Mail } from 'lucide-react';
import { api } from '../../services/api';

const initialCustomerData = {
  customerType: 'ORGANIZATION',
  name: '',
  companyName: '',
  taxId: '',
  email: '',
  phone: '',
  city: '',
  address: '',
  notes: ''
};

const QuickCustomerModal = ({
  isOpen,
  onClose,
  onSuccess,
  subtitle = 'Create customer in-place without losing form progress'
}) => {
  const [formData, setFormData] = useState(initialCustomerData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);



  if (!isOpen) return null;

  // Seamlessly switch customer types while preserving entered name
  const handleTypeChange = (newType) => {
    setFormData((prev) => {
      const existingName = (prev.companyName || prev.name || '').trim();
      return {
        ...prev,
        customerType: newType,
        name: newType === 'INDIVIDUAL' ? (prev.name || existingName) : prev.name,
        companyName: newType === 'ORGANIZATION' ? (prev.companyName || existingName) : prev.companyName
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const displayName = (formData.name || '').trim();
    const company = (formData.companyName || '').trim();
    const isOrg = formData.customerType === 'ORGANIZATION';

    const primaryName = isOrg ? (company || displayName) : (displayName || company);

    if (!primaryName) {
      setError(isOrg ? 'Please enter Company / Firm Name' : 'Please enter Client / Contractor Name');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customerType: formData.customerType,
        name: primaryName,
        companyName: isOrg ? (company || primaryName) : (company || null),
        taxId: formData.taxId?.trim() || null,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        city: formData.city?.trim() || null,
        address: formData.address?.trim() || null,
        notes: formData.notes?.trim() || null
      };

      const created = await api.createCustomer(payload);

      setFormData(initialCustomerData);
      if (onSuccess) {
        onSuccess(created);
      }
      onClose();
    } catch (err) {
      console.error('Quick customer creation error:', err);
      setError(err.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} busy={loading} title="Add customer" subtitle={subtitle} maxWidth="max-w-lg">
        <form onSubmit={handleSubmit} className="app-dialog-form text-xs">
          <div className="app-dialog-fields space-y-3">
          {error && (
            <div role="alert" className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-2"><p className="text-sm font-medium text-steel-700">Customer type</p><FilterTabs label="Customer classification" value={formData.customerType} onChange={handleTypeChange} options={[{ value: 'ORGANIZATION', label: 'Organization' }, { value: 'INDIVIDUAL', label: 'Individual' }]} /></div>

          {/* Form Fields according to Customer Type */}
          {formData.customerType === 'ORGANIZATION' ? (
            <>
              {/* Company / Firm Name */}
              <div>
                <label htmlFor="quickcustomermodal-field-1" className="block text-xs font-semibold text-steel-700 mb-1">
                  Company / Contractor / Firm Name <span className="text-rose-600 font-bold" aria-hidden="true">*</span>
                </label>
                <input id="quickcustomermodal-field-1"
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Yusuf Bhai Glass Works / Alpha Developers"
                  className="w-full text-xs py-1.5 px-2.5 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600 font-medium"
                />
              </div>

              {/* Contact Person Name */}
              <div>
                <label htmlFor="quickcustomermodal-field-2" className="block text-xs font-semibold text-steel-700 mb-1">
                  Contact Person Name <span className="font-normal text-steel-400">(Optional)</span>
                </label>
                <input id="quickcustomermodal-field-2"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Mr. Yusuf Bhai"
                  className="w-full text-xs py-1.5 px-2.5 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
                />
              </div>
            </>
          ) : (
            <div>
              <label htmlFor="quickcustomermodal-field-3" className="block text-xs font-semibold text-steel-700 mb-1">
                Client / Individual Full Name <span className="text-rose-600 font-bold" aria-hidden="true">*</span>
              </label>
              <input id="quickcustomermodal-field-3"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rajesh Kumar / Sneha Patel"
                className="w-full text-xs py-1.5 px-2.5 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600 font-medium"
              />
            </div>
          )}

          {/* Phone & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="quickcustomermodal-field-4" className="block text-xs font-semibold text-steel-700 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-steel-400" />
                <span>Phone / Mobile</span>
              </label>
              <input id="quickcustomermodal-field-4"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className="w-full text-xs py-1.5 px-2.5 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
              />
            </div>
            <div>
              <label htmlFor="quickcustomermodal-field-5" className="block text-xs font-semibold text-steel-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-steel-400" />
                <span>City / Town</span>
              </label>
              <input id="quickcustomermodal-field-5"
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Nagpur"
                className="w-full text-xs py-1.5 px-2.5 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
              />
            </div>
          </div>

          {/* GSTIN / Tax ID & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="quickcustomermodal-field-6" className="block text-xs font-semibold text-steel-700 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3 text-steel-400" />
                <span>GSTIN / Tax ID</span>
              </label>
              <input id="quickcustomermodal-field-6"
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="e.g. 27AAAAA0000A1Z5"
                className="w-full text-xs py-1.5 px-2.5 font-mono uppercase bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
              />
            </div>
            <div>
              <label htmlFor="quickcustomermodal-field-7" className="block text-xs font-semibold text-steel-700 mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-steel-400" />
                <span>Email Address</span>
              </label>
              <input id="quickcustomermodal-field-7"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@example.com"
                className="w-full text-xs py-1.5 px-2.5 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
              />
            </div>
          </div>

          {/* Detailed Address */}
          <div>
            <label htmlFor="quickcustomermodal-field-8" className="block text-xs font-semibold text-steel-700 mb-1">
              Site / Billing Address
            </label>
            <textarea id="quickcustomermodal-field-8"
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Plot No 42, Wardha Road, Opp. Metro Station"
              className="w-full text-xs p-2 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
            />
          </div>

          {/* Action buttons */}
          </div>
          <div className="app-dialog-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 sm:py-1.5 text-xs font-semibold text-steel-700 bg-white border border-steel-300 rounded-md hover:bg-steel-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-md shadow-xs transition-colors"
            >
              {loading ? 'Saving...' : 'Add & Select Customer'}
            </button>
          </div>
        </form>
    </Modal>
  );
};

export default QuickCustomerModal;
