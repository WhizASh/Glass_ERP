import PageLayout, { FilterTabs, PageError } from '../common/PageLayout';
import { primary } from '../common/ui';
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import CustomerTypeBadge from '../common/CustomerTypeBadge';
import { api } from '../../services/api';

const CustomersView = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
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
  const [formError, setFormError] = useState('');

  const fetchCustomers = () => {
    setLoading(true);
    setListError('');
    const params = {};
    if (selectedType !== 'ALL') params.type = selectedType;

    api.getCustomers(params)
      .then((data) => {
        setCustomers(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setListError(err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, [selectedType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError('');
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
      setFormError(err.message);
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
            <span className="block text-xs text-steel-500 font-normal">
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
        <span className="text-sm tabular-nums text-steel-600">
          {row.taxId || '—'}
        </span>
      )
    },
    {
      header: 'Registered',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-sm tabular-nums text-steel-500">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
        </span>
      )
    }
  ];

  return (
    <PageLayout title="Customers" description="Customer accounts, contacts and billing details." actions={<button type="button" onClick={() => { setFormError(''); setIsModalOpen(true); }} className={primary}><Plus className="h-4 w-4" aria-hidden="true" />Add customer</button>}>
      <FilterTabs label="Customer type" value={selectedType} onChange={setSelectedType} options={[{ value: 'ALL', label: 'All customers' }, { value: 'ORGANIZATION', label: 'Organizations' }, { value: 'INDIVIDUAL', label: 'Individuals' }]} />

      {listError && <PageError message={listError} onRetry={fetchCustomers} />}
      {/* Customers Table */}
      {!listError && <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        tableAriaLabel="Customer Directory Table"
        emptyMessage="No clients found in directory"
        emptySubtext="Start building your client base by registering architectural contractors or buyers."
        actionButton={
          <button
            onClick={() => { setFormError(''); setIsModalOpen(true); }}
            className="btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client Account</span>
          </button>
        }
      />}

      {/* Add Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        busy={isSubmitting}
        onClose={() => setIsModalOpen(false)}
        title="Add Customer / Architectural Contractor"
        subtitle="Register an individual client or commercial organization"
      >
        <form onSubmit={handleSubmit} className="app-dialog-form text-xs">
          <fieldset disabled={isSubmitting} className="app-dialog-fields min-w-0 space-y-4">
          {formError && <PageError message={formError} />}
          <div className="space-y-2"><p className="text-sm font-medium text-steel-700">Customer type</p><FilterTabs label="Customer classification" value={formData.customerType} onChange={customerType => setFormData({ ...formData, customerType })} options={[{ value: 'ORGANIZATION', label: 'Organization' }, { value: 'INDIVIDUAL', label: 'Individual' }]} /></div>

          {formData.customerType === 'ORGANIZATION' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="customers-field-1" className="block text-xs font-semibold text-steel-700 mb-1">
                  Company / Firm Name <span className="text-rose-600 font-bold" aria-hidden="true">*</span>
                </label>
                <input id="customers-field-1"
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Bharat Glass & Façades Pvt Ltd"
                  className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600"
                />
              </div>
              <div>
                <label htmlFor="customers-field-2" className="block text-xs font-semibold text-steel-700 mb-1">GSTIN / Tax ID</label>
                <input id="customers-field-2"
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
              <label htmlFor="customers-field-3" className="block text-xs font-semibold text-steel-700 mb-1">
                {formData.customerType === 'ORGANIZATION' ? 'Contact Person Name' : 'Full Name'} <span className="text-rose-600 font-bold" aria-hidden="true">*</span>
              </label>
              <input id="customers-field-3"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rajesh Sharma"
                className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600"
              />
            </div>
            <div>
              <label htmlFor="customers-field-4" className="block text-xs font-semibold text-steel-700 mb-1">Email Address</label>
              <input id="customers-field-4"
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
              <label htmlFor="customers-field-5" className="block text-xs font-semibold text-steel-700 mb-1">Phone Number</label>
              <input id="customers-field-5"
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98201 12345"
                className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 font-mono text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600"
              />
            </div>
            <div>
              <label htmlFor="customers-field-6" className="block text-xs font-semibold text-steel-700 mb-1">City / Delivery Region</label>
              <input id="customers-field-6"
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Mumbai, Maharashtra"
                className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="customers-field-7" className="block text-xs font-semibold text-steel-700 mb-1">Delivery Address</label>
            <textarea id="customers-field-7"
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Plot 42, MIDC Industrial Area, Andheri East, Mumbai"
              className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 focus:outline-none focus:ring-1 focus:ring-edge-600"
            />
          </div>

          </fieldset>
          <div className="app-dialog-actions">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 sm:py-1.5 rounded-md text-xs font-semibold text-steel-700 bg-white border border-steel-300 hover:bg-steel-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary px-4 py-2 sm:py-1.5 rounded-md text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSubmitting ? 'Saving...' : 'Register Client'}
            </button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  );
};

export default CustomersView;
