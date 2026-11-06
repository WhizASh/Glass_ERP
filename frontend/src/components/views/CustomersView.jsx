import React, { useState, useEffect } from 'react';
import { Users, Plus, Filter, Building2, User } from 'lucide-react';
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
      header: 'Customer / Company',
      accessor: 'name',
      render: (row) => (
        <div>
          <span className="font-semibold text-steel-900">
            {row.companyName ? row.companyName : row.name}
          </span>
          {row.companyName && (
            <span className="block text-[11px] text-steel-500 font-normal">
              Attn: {row.name}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Classification',
      accessor: 'customerType',
      render: (row) => <CustomerTypeBadge type={row.customerType} />
    },
    {
      header: 'Contact Info',
      accessor: 'email',
      render: (row) => (
        <div className="text-xs">
          {row.email && <span className="block text-steel-700">{row.email}</span>}
          {row.phone && <span className="block text-steel-500 font-mono">{row.phone}</span>}
          {!row.email && !row.phone && <span className="text-steel-400">—</span>}
        </div>
      )
    },
    {
      header: 'City / Region',
      accessor: 'city',
      render: (row) => (
        <span className="text-xs text-steel-600">
          {row.city || '—'}
        </span>
      )
    },
    {
      header: 'Tax ID / GSTIN',
      accessor: 'taxId',
      render: (row) => (
        <span className="font-mono text-xs text-steel-600">
          {row.taxId || '—'}
        </span>
      )
    },
    {
      header: 'Registered',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-xs font-mono text-steel-500">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Top Action & Filter Bar */}
      <div className="bg-white rounded-lg border border-steel-200 p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-steel-400" />
          <span className="text-xs font-semibold text-steel-600 uppercase tracking-wider mr-1">Filter:</span>
          {['ALL', 'ORGANIZATION', 'INDIVIDUAL'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedType === t
                  ? 'filter-pill-active bg-slate-900 text-white font-semibold shadow-xs'
                  : 'filter-pill-inactive text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {t === 'ALL' ? 'All Directory' : t === 'ORGANIZATION' ? 'Organizations / Firms' : 'Individuals'}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Client Account</span>
        </button>
      </div>

      {/* Customers Table */}
      <DataTable
        columns={columns}
        data={customers}
        tableAriaLabel="Customer Directory Table"
        emptyMessage="No clients found in directory"
        emptySubtext="Start building your client base by registering architectural contractors or buyers."
        actionButton={
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client Account</span>
          </button>
        }
      />

      {/* Add Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Customer / Architectural Contractor"
        subtitle="Register an individual client or commercial organization"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-steel-700 mb-1.5">
              Customer Classification
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, customerType: 'ORGANIZATION' })}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-md border text-xs font-semibold transition-colors ${
                  formData.customerType === 'ORGANIZATION'
                    ? 'border-edge-600 bg-edge-50 text-edge-900 ring-1 ring-edge-600'
                    : 'border-steel-300 bg-white text-steel-600 hover:bg-steel-50'
                }`}
              >
                <Building2 className="w-4 h-4 text-edge-700" />
                <span>Organization / Commercial Firm</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, customerType: 'INDIVIDUAL' })}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-md border text-xs font-semibold transition-colors ${
                  formData.customerType === 'INDIVIDUAL'
                    ? 'border-edge-600 bg-edge-50 text-edge-900 ring-1 ring-edge-600'
                    : 'border-steel-300 bg-white text-steel-600 hover:bg-steel-50'
                }`}
              >
                <User className="w-4 h-4 text-edge-700" />
                <span>Individual Contractor</span>
              </button>
            </div>
          </div>

          {formData.customerType === 'ORGANIZATION' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-steel-700 mb-1">Company / Firm Name *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Bharat Glass & Façades Pvt Ltd"
                  className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-steel-700 mb-1">GSTIN / Tax ID</label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  placeholder="e.g. 27AABCU9603R1ZM"
                  className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 font-mono text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-steel-700 mb-1">
                {formData.customerType === 'ORGANIZATION' ? 'Contact Person Name *' : 'Full Name *'}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rajesh Sharma"
                className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-steel-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="procurement@bharatglass.in"
                className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-steel-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98201 12345"
                className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 font-mono text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-steel-700 mb-1">City / Delivery Region</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Mumbai, Maharashtra"
                className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-steel-700 mb-1">Delivery Address</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Plot 42, MIDC Industrial Area, Andheri East, Mumbai"
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
              {isSubmitting ? 'Saving...' : 'Register Client'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomersView;
