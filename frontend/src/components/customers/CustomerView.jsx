import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import CustomerList from './CustomerList';
import CustomerFormModal from './CustomerFormModal';
import Button from '../common/Button';
import { api } from '../../services/api';

export default function CustomerView({ isAddModalOpen, setIsAddModalOpen }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers();
      setCustomers(data || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCustomer = async (custData) => {
    if (editingCustomer && editingCustomer.id) {
      await api.updateCustomer(editingCustomer.id, custData);
    } else {
      await api.createCustomer(custData);
    }
    setEditingCustomer(null);
    loadData();
  };

  const orgCount = customers.filter((c) => c.type === 'ORGANIZATION').length;
  const indCount = customers.filter((c) => c.type === 'INDIVIDUAL').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Client & Glazing Contractor Directory
          </h2>
          <p className="text-xs text-slate-500">
            Maintain accounts for architectural firms, facade builders, and individual clients
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadData} isLoading={loading}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setEditingCustomer(null);
              setIsAddModalOpen(true);
            }}
          >
            Register Client Account
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 border border-slate-200/90 bg-white shadow-xs">
          <span className="text-xs text-slate-500 uppercase font-semibold">Total Active Accounts</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{customers.length} Accounts</div>
        </div>
        <div className="glass-card p-4 border border-slate-200/90 bg-white shadow-xs">
          <span className="text-xs text-slate-500 uppercase font-semibold">Commercial Organizations</span>
          <div className="text-xl font-bold text-sky-600 mt-1">{orgCount} Firms</div>
        </div>
        <div className="glass-card p-4 border border-slate-200/90 bg-white shadow-xs">
          <span className="text-xs text-slate-500 uppercase font-semibold">Individual Clients</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">{indCount} Clients</div>
        </div>
      </div>

      {/* Directory list */}
      <CustomerList
        customers={customers}
        onSelectCustomer={(cust) => {
          setEditingCustomer(cust);
          setIsAddModalOpen(true);
        }}
      />

      {/* Add / Edit Customer Modal */}
      <CustomerFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCustomer(null);
        }}
        initialData={editingCustomer}
        onSaveCustomer={handleSaveCustomer}
      />
    </div>
  );
}
