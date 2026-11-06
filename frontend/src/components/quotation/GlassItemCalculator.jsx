import React, { useState, useMemo } from 'react';
import { Plus, Calculator, Pencil, Check } from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import GlassItemsTable from './GlassItemsTable';
import {
  GLASS_TYPES,
  STANDARD_THICKNESSES,
  EDGE_WORK_TYPES,
  calculateLineItemPrice,
} from '../../utils/glassMath';
import { formatCurrency, formatArea, formatWeight } from '../../utils/formatters';

export default function GlassItemCalculator({ items = [], onAddItem, onRemoveItem, onUpdateItem }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [glassType, setGlassType] = useState('ANNEALED_FLOAT');
  const [thicknessMm, setThicknessMm] = useState(6);
  const [widthMm, setWidthMm] = useState('');
  const [heightMm, setHeightMm] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [edgeWork, setEdgeWork] = useState('CLEAN_CUT');
  const [holesCount, setHolesCount] = useState(0);

  // Live calculation of current inputs
  const liveCalc = useMemo(() => {
    const w = Number(widthMm);
    const h = Number(heightMm);
    if (!w || !h || w <= 0 || h <= 0) {
      return { areaSqm: 0, perimeterM: 0, weightKg: 0, unitPrice: 0, lineTotal: 0 };
    }
    return calculateLineItemPrice({
      widthMm: w,
      heightMm: h,
      thicknessMm: Number(thicknessMm),
      glassType,
      edgeWork,
      holesCount: Number(holesCount || 0),
      quantity: Number(quantity || 1),
    });
  }, [widthMm, heightMm, thicknessMm, glassType, edgeWork, holesCount, quantity]);

  const handleEditItem = (index) => {
    const item = items[index];
    setGlassType(item.glassType || 'ANNEALED_FLOAT');
    setThicknessMm(Number(item.thicknessMm) || 6);
    setWidthMm(item.widthMm || '');
    setHeightMm(item.heightMm || '');
    setQuantity(item.quantity || 1);
    setEdgeWork(item.edgeWork || 'CLEAN_CUT');
    setHolesCount(item.holesCount || 0);
    setEditingIndex(index);
  };

  const handleAdd = () => {
    const w = Number(widthMm);
    const h = Number(heightMm);
    if (!w || !h || w <= 0 || h <= 0) {
      alert('Please enter valid width and height dimensions in mm (e.g. 1500 x 900)');
      return;
    }

    const glassTypeObj = GLASS_TYPES.find((g) => g.id === glassType);
    const edgeObj = EDGE_WORK_TYPES.find((e) => e.id === edgeWork);

    const newItem = {
      id: editingIndex !== null ? (items[editingIndex]?.id || `item-${Date.now()}`) : `item-${Date.now()}`,
      glassType,
      glassTypeName: glassTypeObj?.label || glassType,
      thicknessMm: Number(thicknessMm),
      widthMm: w,
      heightMm: h,
      areaSqM: liveCalc.areaSqm,
      perimeterM: liveCalc.perimeterM,
      weightKg: liveCalc.weightKg,
      quantity: Number(quantity) || 1,
      edgeWork,
      edgeWorkName: edgeObj?.label || edgeWork,
      holesCount: Number(holesCount) || 0,
      unitPrice: liveCalc.unitPrice,
      lineTotal: liveCalc.lineTotal,
    };

    if (editingIndex !== null && onUpdateItem) {
      onUpdateItem(editingIndex, newItem);
      setEditingIndex(null);
    } else {
      onAddItem(newItem);
    }

    setWidthMm('');
    setHeightMm('');
    setHolesCount(0);
    setQuantity(1);
    setEdgeWork('CLEAN_CUT');
  };

  return (
    <div className="space-y-4">
      {/* Precision Calculator Panel */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
            <Calculator className="w-4 h-4" /> Glass Spec Calculator & Pricing Engine
          </span>
          <span className="text-[11px] text-slate-500">Dimensions in millimeters (mm)</span>
        </div>

        {/* Glass Type & Thickness */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Glass Grade / Processing Type"
            value={glassType}
            onChange={(e) => setGlassType(e.target.value)}
            options={GLASS_TYPES.map((g) => ({ value: g.id, label: g.label }))}
          />
          <Select
            label="Nominal Thickness"
            value={thicknessMm}
            onChange={(e) => setThicknessMm(Number(e.target.value))}
            options={STANDARD_THICKNESSES.map((t) => ({ value: t, label: `${t} mm Glass` }))}
          />
        </div>

        {/* Dimensions & Quantity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Width (W)"
            type="number"
            min="50"
            max="6000"
            suffix="mm"
            placeholder="e.g. 1500"
            value={widthMm}
            onChange={(e) => setWidthMm(e.target.value)}
          />
          <Input
            label="Height (H)"
            type="number"
            min="50"
            max="3500"
            suffix="mm"
            placeholder="e.g. 900"
            value={heightMm}
            onChange={(e) => setHeightMm(e.target.value)}
          />
          <Input
            label="Quantity"
            type="number"
            min="1"
            placeholder="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        {/* Fabrication: Edge Work & CNC Holes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Edge Processing / Polishing"
            value={edgeWork}
            onChange={(e) => setEdgeWork(e.target.value)}
            options={EDGE_WORK_TYPES.map((e) => ({
              value: e.id,
              label: e.ratePerMeter > 0 ? `${e.label} (+₹${e.ratePerMeter}/m)` : e.label,
            }))}
          />
          <Input
            label="CNC Drilled Holes / Cutouts"
            type="number"
            min="0"
            suffix="holes"
            placeholder="0"
            value={holesCount}
            onChange={(e) => setHolesCount(e.target.value)}
          />
        </div>

        {/* Live Metrics & Cost Preview Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs">
          <div>
            <span className="text-slate-500 block">Unit Surface Area</span>
            <span className="font-semibold text-slate-800">
              {liveCalc.areaSqm > 0 ? formatArea(liveCalc.areaSqm) : '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Edge Perimeter</span>
            <span className="font-semibold text-slate-800">
              {liveCalc.perimeterM > 0 ? `${liveCalc.perimeterM} linear m` : '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Total Est. Weight</span>
            <span className="font-semibold text-slate-800">
              {liveCalc.weightKg > 0 ? formatWeight(liveCalc.weightKg * (Number(quantity) || 1)) : '—'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block">Line Item Total</span>
            <span className="text-base font-bold text-sky-700 font-mono">
              {formatCurrency(liveCalc.lineTotal)}
            </span>
          </div>
        </div>

        {/* Add / Update Button */}
        <div className="flex justify-end items-center gap-2 pt-1">
          {editingIndex !== null && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingIndex(null);
                setWidthMm('');
                setHeightMm('');
                setHolesCount(0);
                setQuantity(1);
                setEdgeWork('CLEAN_CUT');
              }}
            >
              Cancel
            </Button>
          )}
          <Button variant="primary" size="sm" icon={editingIndex !== null ? Check : Plus} onClick={handleAdd}>
            {editingIndex !== null ? 'Update Glass Pane' : 'Add Line Item to Quotation'}
          </Button>
        </div>
      </div>

      {/* Added Line Items Table Subcomponent */}
      <GlassItemsTable
        items={items}
        editingIndex={editingIndex}
        onEditItem={handleEditItem}
        onRemoveItem={onRemoveItem}
      />
    </div>
  );
}
