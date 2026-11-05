import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Calculator } from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import {
  GLASS_TYPES,
  STANDARD_THICKNESSES,
  EDGE_WORK_TYPES,
  calculateLineItemPrice,
} from '../../utils/glassMath';
import { formatCurrency, formatArea, formatWeight } from '../../utils/formatters';

export default function GlassItemCalculator({ items = [], onAddItem, onRemoveItem }) {
  const [glassType, setGlassType] = useState('TOUGHENED_TEMPERED');
  const [thicknessMm, setThicknessMm] = useState(10);
  const [widthMm, setWidthMm] = useState(1500);
  const [heightMm, setHeightMm] = useState(900);
  const [quantity, setQuantity] = useState(1);
  const [edgeWork, setEdgeWork] = useState('FLAT_POLISH');
  const [holesCount, setHolesCount] = useState(2);

  // Live calculation of current inputs
  const liveCalc = useMemo(() => {
    return calculateLineItemPrice({
      widthMm: Number(widthMm),
      heightMm: Number(heightMm),
      thicknessMm: Number(thicknessMm),
      glassType,
      edgeWork,
      holesCount: Number(holesCount),
      quantity: Number(quantity),
    });
  }, [widthMm, heightMm, thicknessMm, glassType, edgeWork, holesCount, quantity]);

  const handleAdd = () => {
    if (!widthMm || !heightMm || widthMm <= 0 || heightMm <= 0) {
      alert('Please enter valid width and height dimensions in mm');
      return;
    }

    const glassTypeObj = GLASS_TYPES.find((g) => g.id === glassType);
    const edgeObj = EDGE_WORK_TYPES.find((e) => e.id === edgeWork);

    const newItem = {
      id: `item-${Date.now()}`,
      glassType,
      glassTypeName: glassTypeObj?.label || glassType,
      thicknessMm: Number(thicknessMm),
      widthMm: Number(widthMm),
      heightMm: Number(heightMm),
      areaSqM: liveCalc.areaSqm,
      perimeterM: liveCalc.perimeterM,
      weightKg: liveCalc.weightKg,
      quantity: Number(quantity),
      edgeWork,
      edgeWorkName: edgeObj?.label || edgeWork,
      holesCount: Number(holesCount),
      unitPrice: liveCalc.unitPrice,
      lineTotal: liveCalc.lineTotal,
    };

    onAddItem(newItem);
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
            value={widthMm}
            onChange={(e) => setWidthMm(e.target.value)}
          />
          <Input
            label="Height (H)"
            type="number"
            min="50"
            max="3500"
            suffix="mm"
            value={heightMm}
            onChange={(e) => setHeightMm(e.target.value)}
          />
          <Input
            label="Quantity"
            type="number"
            min="1"
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
              label: `${e.label} (+$${e.ratePerMeter}/m)`,
            }))}
          />
          <Input
            label="CNC Drilled Holes / Cutouts"
            type="number"
            min="0"
            suffix="holes"
            value={holesCount}
            onChange={(e) => setHolesCount(e.target.value)}
          />
        </div>

        {/* Live Metrics & Cost Preview Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs">
          <div>
            <span className="text-slate-500 block">Unit Surface Area</span>
            <span className="font-semibold text-slate-800">{formatArea(liveCalc.areaSqm)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Edge Perimeter</span>
            <span className="font-semibold text-slate-800">{liveCalc.perimeterM} linear m</span>
          </div>
          <div>
            <span className="text-slate-500 block">Total Est. Weight</span>
            <span className="font-semibold text-slate-800">
              {formatWeight(liveCalc.weightKg * (Number(quantity) || 1))}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block">Line Item Total</span>
            <span className="text-base font-bold text-sky-700 font-mono">
              {formatCurrency(liveCalc.lineTotal)}
            </span>
          </div>
        </div>

        {/* Add Button */}
        <div className="flex justify-end pt-1">
          <Button variant="primary" size="sm" icon={Plus} onClick={handleAdd}>
            Add Line Item to Quotation
          </Button>
        </div>
      </div>

      {/* Added Line Items Table */}
      {items.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
            Quotation Line Items ({items.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 font-medium">Glass Specification</th>
                  <th className="px-4 py-2 font-medium">Dimensions</th>
                  <th className="px-4 py-2 font-medium">Area</th>
                  <th className="px-4 py-2 font-medium">Fabrication</th>
                  <th className="px-4 py-2 font-medium text-center">Qty</th>
                  <th className="px-4 py-2 font-medium text-right">Unit Price</th>
                  <th className="px-4 py-2 font-medium text-right">Total</th>
                  <th className="px-4 py-2 font-medium text-center">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-slate-50/80">
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      {item.glassTypeName || item.glassType}
                      <span className="block text-[10px] text-slate-500">{item.thicknessMm}mm</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700 font-mono">
                      {item.widthMm} × {item.heightMm} mm
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {formatArea(item.areaSqM)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      <div>{item.edgeWorkName || item.edgeWork}</div>
                      {item.holesCount > 0 && (
                        <span className="text-[10px] text-sky-700 font-semibold">
                          {item.holesCount} CNC hole(s)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center font-semibold text-slate-900">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-700 font-mono">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(item.lineTotal)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(index)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
