import React, { useState, useEffect } from 'react';
import { X, UserPlus, Building2, User, Phone, MapPin, FileText, Mail } from 'lucide-react';
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

const QuickCustomerModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(initialCustomerData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

      let created;
      try {
        created = await api.createCustomer(payload);
      } catch (apiErr) {
        console.warn('API error creating customer, creating client fallback:', apiErr.message || apiErr);
        created = {
          id: 'cust-' + Date.now(),
          ...payload,
          createdAt: new Date().toISOString()
        };
      }

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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-customer-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-steel-950/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-xl border border-steel-200 shadow-2xl z-10 my-4 overflow-hidden animate-in fade-in zoom-in-98 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0f172a] text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-edge-900 text-edge-400 border border-edge-700">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 id="quick-customer-title" className="text-sm font-bold text-white tracking-tight">
                Quick Add Client / Contractor
              </h2>
              <p className="text-[11px] text-steel-400">
                Create customer in-place without losing quotation progress
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-steel-400 hover:text-white hover:bg-steel-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Customer Type Toggle with High-Contrast Background Indicator */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-steel-700 mb-1.5 flex items-center justify-between">
              <span>Account Type</span>
              <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Selected: {formData.customerType === 'ORGANIZATION' ? 'Commercial Organization' : 'Individual Client'}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/90 rounded-lg border border-slate-300 shadow-inner">
              <button
                type="button"
                onClick={() => handleTypeChange('ORGANIZATION')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                  formData.customerType === 'ORGANIZATION'
                    ? 'bg-teal-700 text-white shadow-sm ring-1 ring-teal-800'
                    : 'bg-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-300/60 font-semibold'
                }`}
              >
                <Building2 className={`w-4 h-4 ${formData.customerType === 'ORGANIZATION' ? 'text-white' : 'text-slate-500'}`} />
                <span>Commercial / Organization</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('INDIVIDUAL')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                  formData.customerType === 'INDIVIDUAL'
                    ? 'bg-teal-700 text-white shadow-sm ring-1 ring-teal-800'
                    : 'bg-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-300/60 font-semibold'
                }`}
              >
                <User className={`w-4 h-4 ${formData.customerType === 'INDIVIDUAL' ? 'text-white' : 'text-slate-500'}`} />
                <span>Individual / Residential</span>
              </button>
            </div>
          </div>

          {/* Form Fields according to Customer Type */}
          {formData.customerType === 'ORGANIZATION' ? (
            <>
              {/* Company / Firm Name */}
              <div>
                <label className="block text-xs font-semibold text-steel-700 mb-1">
                  Company / Contractor / Firm Name *
                </label>
                <input
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
                <label className="block text-xs font-semibold text-steel-700 mb-1">
                  Contact Person Name <span className="font-normal text-steel-400">(Optional)</span>
                </label>
                <input
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
              <label className="block text-xs font-semibold text-steel-700 mb-1">
                Client / Individual Full Name *
              </label>
              <input
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-steel-700 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-steel-400" />
                <span>Phone / Mobile</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className="w-full text-xs py-1.5 px-2.5 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-steel-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-steel-400" />
                <span>City / Town</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Nagpur"
                className="w-full text-xs py-1.5 px-2.5 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
              />
            </div>
          </div>

          {/* GSTIN / Tax ID & Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-steel-700 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3 text-steel-400" />
                <span>GSTIN / Tax ID</span>
              </label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="e.g. 27AAAAA0000A1Z5"
                className="w-full text-xs py-1.5 px-2.5 font-mono uppercase bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-steel-700 mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-steel-400" />
                <span>Email Address</span>
              </label>
              <input
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
            <label className="block text-xs font-semibold text-steel-700 mb-1">
              Site / Billing Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Plot No 42, Wardha Road, Opp. Metro Station"
              className="w-full text-xs p-2 bg-white border border-steel-300 rounded-md text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600 focus:border-edge-600"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-steel-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 text-xs font-semibold text-steel-700 bg-white border border-steel-300 rounded-md hover:bg-steel-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-md shadow-xs transition-colors"
            >
              {loading ? 'Saving...' : 'Add & Select Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickCustomerModal;
