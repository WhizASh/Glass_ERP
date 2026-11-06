import React, { useState, useEffect } from 'react';
import { Users, Plus, Filter, Building, User } from 'lucide-react';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import CustomerTypeBadge from '../common/CustomerTypeBadge';
import { api } from '../../services/api';

const CustomersView = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customerType: 'ORGANIZATION',
    name: '',
    companyName: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomers = () => {
    setLoading(true);
    const params = {};
    if (selectedType !== 'ALL') params.type = selectedType;

    api.getCustomers(params)
      .then((data) => {
        setCustomers(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.warn('Customers fetch notice:', err.message);
        setCustomers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, [selectedType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSubmitting(true);
    try {
      await api.createCustomer(formData);
      setIsModalOpen(false);
      setFormData({
        customerType: 'ORGANIZATION',
        name: '',
        companyName: '',
        taxId: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        notes: ''
      });
      fetchCustomers();
    } catch (err) {
      alert(`Failed to save customer: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Customer',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800">
            {row.customerType === 'ORGANIZATION' && row.companyName ? row.companyName : row.name}
          </div>
          {row.customerType === 'ORGANIZATION' && (
            <div className="text-xs text-slate-400">
              Contact: {row.name}
            </div>
          )}
          {row.taxId && (
            <div className="text-[11px] text-blue-600 font-mono mt-0.5">
              Tax ID: {row.taxId}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'customerType',
      render: (row) => <CustomerTypeBadge type={row.customerType} />
    },
    {
      header: 'Contact Details',
      accessor: 'email',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          {row.email && <div className="text-slate-600">{row.email}</div>}
          {row.phone && <div className="text-slate-400">{row.phone}</div>}
        </div>
      )
    },
    {
      header: 'Location',
      accessor: 'city',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.city || row.address || '—'}
        </span>
      )
    },
    {
      header: 'Created At',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-xs text-slate-400">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Action & Filter Bar */}
      <div className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Customer Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase mr-1">Filter:</span>
          {['ALL', 'ORGANIZATION', 'INDIVIDUAL'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedType === t
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'glass-button text-slate-600 hover:text-slate-800'
              }`}
            >
              {t === 'ALL' ? 'All Customers' : t === 'ORGANIZATION' ? 'Organizations' : 'Individuals'}
            </button>
          ))}
        </div>

        {/* Add Customer Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Customers Table */}
      <DataTable
        columns={columns}
        data={customers}
        tableAriaLabel="Customer Directory Table"
        emptyMessage="No customers found in directory"
        emptySubtext="Start building your client base by adding organizations or individual buyers."
        actionButton={
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        }
      />

      {/* Add Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Customer"
        subtitle="Register an individual client or commercial organization"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Customer Classification
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, customerType: 'ORGANIZATION' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  formData.customerType === 'ORGANIZATION'
                    ? 'border-blue-500 bg-blue-50/70 text-blue-700 ring-1 ring-blue-500/30'
                    : 'border-slate-200 bg-white/50 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building className="w-4 h-4 text-blue-600" />
                <span>Organization / Commercial</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, customerType: 'INDIVIDUAL' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  formData.customerType === 'INDIVIDUAL'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-700 ring-1 ring-emerald-500/30'
                    : 'border-slate-200 bg-white/50 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4 text-emerald-600" />
                <span>Individual Buyer</span>
              </button>
            </div>
          </div>

          {/* Conditional Fields based on Type */}
          {formData.customerType === 'ORGANIZATION' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Company / Organization Name *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Apex Glass & Aluminium Ltd"
                  className="w-full px-3 py-2 text-sm rounded-xl glass-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">GSTIN / Tax ID</label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  placeholder="e.g. 27AABCU9603R1ZM"
                  className="w-full px-3 py-2 text-sm rounded-xl glass-input font-mono text-xs"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {formData.customerType === 'ORGANIZATION' ? 'Contact Person Name *' : 'Full Name *'}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 text-sm rounded-xl glass-input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +1 555-0192"
                className="w-full px-3 py-2 text-sm rounded-xl glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. info@company.com"
                className="w-full px-3 py-2 text-sm rounded-xl glass-input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">City / Region</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Chicago, IL"
                className="w-full px-3 py-2 text-sm rounded-xl glass-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Full Billing / Shipping Address</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Address details..."
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
              {isSubmitting ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomersView;
