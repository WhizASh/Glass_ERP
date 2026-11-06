import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import InventoryFilters from './InventoryFilters';
import InventoryTable from './InventoryTable';
import AddEditItemModal from './AddEditItemModal';
import StockAdjustmentModal from './StockAdjustmentModal';
import Button from '../common/Button';
import { api } from '../../services/api';

export default function InventoryView({ isAddModalOpen, setIsAddModalOpen }) {
  const [inventory, setInventory] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [editingItem, setEditingItem] = useState(null);
  const [adjustingItem, setAdjustingItem] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getInventory(activeCategory);
      setInventory(data || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCategory]);

  const handleSaveItem = async (formData) => {
    if (editingItem) {
      await api.updateInventoryItem(editingItem.id, formData);
    } else {
      await api.createInventoryItem(formData);
    }
    loadData();
  };

  const handleAdjustStock = async (id, adjustment) => {
    await api.adjustStock(id, adjustment);
    loadData();
  };

  // Filter items by search
  const filteredItems = inventory.filter((item) => {
    const term = searchTerm.toLowerCase();
    const skuStr = item.sku || '';
    const nameStr = item.name || '';
    const rackStr = item.rackLocation || '';
    const matchesSku = skuStr.toLowerCase().includes(term);
    const matchesName = nameStr.toLowerCase().includes(term);
    const matchesRack = rackStr.toLowerCase().includes(term);
    return matchesSku || matchesName || matchesRack;
  });

  const lowStockCount = inventory.filter((i) => i.stockQuantity <= i.reorderLevel).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Warehouse Inventory & Raw Float Management
          </h2>
          <p className="text-xs text-slate-500">
            Real-time stock ledger, A-frame / rack mapping, and cullet scrap tracking
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
              setEditingItem(null);
              setIsAddModalOpen(true);
            }}
          >
            Add Catalog SKU
          </Button>
        </div>
      </div>

      {/* Low stock warning banner if any */}
      {lowStockCount > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{lowStockCount} inventory items</strong> have fallen below safety reorder levels.
            </span>
          </div>
          <button
            onClick={() => setSearchTerm('')}
            className="text-[11px] font-semibold text-amber-700 underline hover:text-amber-900"
          >
            Review Restocking Needs
          </button>
        </div>
      )}

      {/* Filter bar */}
      <InventoryFilters
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        searchTerm={searchTerm}
        onChangeSearch={setSearchTerm}
      />

      {/* Inventory Table */}
      <InventoryTable
        items={filteredItems}
        onEditItem={(item) => {
          setEditingItem(item);
          setIsAddModalOpen(true);
        }}
        onAdjustItem={(item) => setAdjustingItem(item)}
      />

      {/* Add / Edit Item Modal */}
      <AddEditItemModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        initialData={editingItem}
        onSave={handleSaveItem}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={Boolean(adjustingItem)}
        onClose={() => setAdjustingItem(null)}
        item={adjustingItem}
        onAdjustStock={handleAdjustStock}
      />
    </div>
  );
}
