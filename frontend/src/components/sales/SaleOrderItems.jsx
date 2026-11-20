import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatBillingSize } from '../../lib/glassCalculations';
import { SaleField, SaleSection, secondaryButton, money } from './saleUi';

export default function SaleOrderItems({ items, products, disabled, onAdd, onRemove, onUpdate, getSqft, getLineTotal }) {
  return (
    <SaleSection title="Glass items" subtitle="Enter cut dimensions in inches. Billing area uses the 6-inch grid." action={!disabled && <button type="button" onClick={onAdd} className={secondaryButton}><Plus className="h-4 w-4" aria-hidden="true" />Add item</button>}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <fieldset key={index} disabled={disabled} className="min-w-0 rounded-lg border border-steel-200 bg-white p-3">
            <legend className="sr-only">Glass item {index + 1}</legend>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-steel-700">Item {String(index + 1).padStart(2, '0')}{item.sectionName && <span className="ml-2 font-normal text-steel-500">{item.sectionName}</span>}</p>
              {!disabled && <button type="button" onClick={() => onRemove(index)} disabled={items.length === 1} aria-label={`Remove item ${index + 1}`} className="flex h-11 w-11 items-center justify-center rounded-md text-steel-500 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:opacity-30"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SaleField label="Catalog item"><select value={item.productSkuId || ''} onChange={event => onUpdate(index, 'productSkuId', event.target.value)}><option value="">Custom specification</option>{products.map(product => <option key={product.id} value={product.id}>{product.skuCode} · {product.name} ({product.thicknessMm}mm)</option>)}</select></SaleField>
              <SaleField label="Specification *"><input required value={item.description || ''} onChange={event => onUpdate(index, 'description', event.target.value)} placeholder="e.g. 12mm clear toughened glass" /></SaleField>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <SaleField label="Width (in)"><input type="number" inputMode="decimal" min="1" step="0.1" placeholder="0" value={item.widthInches ?? ''} onChange={event => onUpdate(index, 'widthInches', event.target.value)} /></SaleField>
              <SaleField label="Height (in)"><input type="number" inputMode="decimal" min="1" step="0.1" placeholder="0" value={item.heightInches ?? ''} onChange={event => onUpdate(index, 'heightInches', event.target.value)} /></SaleField>
              <SaleField label="Quantity *"><input type="number" inputMode="numeric" required min="1" value={item.quantity} onChange={event => onUpdate(index, 'quantity', event.target.value)} /></SaleField>
              <SaleField label="Total area (sqft)"><input type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" value={item.totalSqft !== '' && item.totalSqft != null ? item.totalSqft : getSqft(item) || ''} onChange={event => onUpdate(index, 'totalSqft', event.target.value)} /></SaleField>
              <SaleField label="Rate (₹/sqft) *"><input type="number" inputMode="decimal" required min="0" step="0.01" value={item.unitPrice} onChange={event => onUpdate(index, 'unitPrice', event.target.value)} /></SaleField>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-steel-100 pt-2 text-xs">
              <p className="text-steel-500">Billing size <span className="ml-1 font-medium text-steel-700">{item.widthInches && item.heightInches ? formatBillingSize(item.widthInches, item.heightInches) : '—'}</span></p>
              <p className="text-steel-500">Line total <output className="ml-2 text-sm font-semibold tabular-nums text-steel-900">{money(getLineTotal(item))}</output></p>
            </div>
          </fieldset>
        ))}
      </div>
    </SaleSection>
  );
}
