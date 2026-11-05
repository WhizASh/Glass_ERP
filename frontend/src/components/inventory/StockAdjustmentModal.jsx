import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { AlertOctagon } from 'lucide-react';

const REASON_OPTIONS = [
  { value: 'SCRAP_BREAKAGE', label: 'Scrap / Breakage during Cutting & Handling (Cullet)' },
  { value: 'MANUAL_ADJUSTMENT', label: 'Physical Audit Cycle Adjustment' },
];

export default function StockAdjustmentModal({
  isOpen,
  onClose,
  item,
  onAdjustStock,
}) {
  const [adjustmentQty, setAdjustmentQty] = useState(-1);
  const [reason, setReason] = useState('SCRAP_BREAKAGE');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!item) return null;

  const currentStock = Number(item.stockQuantity) || 0;
  const resultingStock = Math.max(0, currentStock + Number(adjustmentQty || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(adjustmentQty) === 0) {
      alert('Please specify an adjustment quantity');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdjustStock(item.id, {
        quantity: Number(adjustmentQty),
        reason,
        notes,
      });
      onClose();
    } catch (err) {
      console.error('Failed to adjust stock:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Audit & Cullet / Breakage Log"
      subtitle={`Item: ${item.sku} - ${item.name}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
          <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            Cullet breakage will be recorded into the facility ledger to track recycling cullet tonnage and maintain physical inventory parity.
          </p>
        </div>

        <Select
          label="Adjustment Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          options={REASON_OPTIONS}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Adjustment Quantity (+ or -)"
            type="number"
            step="any"
            helperText="Use negative number for broken or discarded stock"
            required
            value={adjustmentQty}
            onChange={(e) => setAdjustmentQty(e.target.value)}
          />

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-xs flex flex-col justify-center">
            <span className="text-slate-500">Resulting Stock:</span>
            <span className="text-sm font-bold text-slate-800">
              {resultingStock} {item.unitOfMeasure}
            </span>
          </div>
        </div>

        <Input
          label="Notes / Incident Details"
          placeholder="e.g. Sheet cracked on CNC edging table; routed to cullet bin."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" isLoading={isSubmitting}>
            Record Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
