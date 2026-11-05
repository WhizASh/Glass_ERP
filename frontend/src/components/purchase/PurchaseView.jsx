import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import PurchaseTable from './PurchaseTable';
import PurchaseFormModal from './PurchaseFormModal';
import Button from '../common/Button';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

export default function PurchaseView({ isNewModalOpen, setIsNewModalOpen }) {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pData, sData, iData] = await Promise.all([
        api.getPurchases(),
        api.getSuppliers(),
        api.getInventory(),
      ]);
      setPurchases(pData || []);
      setSuppliers(sData || []);
      setInventory(iData || []);
    } catch (err) {
      console.error('Failed to load purchase data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePurchase = async (purchaseData) => {
    const created = await api.createPurchase(purchaseData);
    if (created) {
      loadData();
    }
    return created;
  };

  const handleAddNewSupplier = async (supplierData) => {
    const created = await api.createSupplier(supplierData);
    if (created) {
      setSuppliers((prev) => [...prev, created]);
    }
    return created;
  };

  const totalSpent = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Raw Material Procurement & PO Receipts
          </h2>
          <p className="text-xs text-slate-500">
            Log float glass packs, PVB interlayer rolls, sealants, and track supplier invoices
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
            onClick={() => setIsNewModalOpen(true)}
          >
            Record Purchase Order
          </Button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 border border-slate-200/90 bg-white shadow-xs">
          <span className="text-xs text-slate-500 uppercase font-semibold">Total Purchases Logged</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{purchases.length} Orders</div>
        </div>
        <div className="glass-card p-4 border border-slate-200/90 bg-white shadow-xs">
          <span className="text-xs text-slate-500 uppercase font-semibold">Total Procurement Spend</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalSpent)}</div>
        </div>
        <div className="glass-card p-4 border border-slate-200/90 bg-white shadow-xs">
          <span className="text-xs text-slate-500 uppercase font-semibold">Active Glass Suppliers</span>
          <div className="text-xl font-bold text-sky-600 mt-1">{suppliers.length} Vendors</div>
        </div>
      </div>

      {/* Purchase Table */}
      <PurchaseTable purchases={purchases} suppliers={suppliers} />

      {/* Purchase Form Modal */}
      <PurchaseFormModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        inventoryItems={inventory}
        suppliers={suppliers}
        onSubmitPurchase={handleCreatePurchase}
        onAddNewSupplier={handleAddNewSupplier}
      />
    </div>
  );
}
