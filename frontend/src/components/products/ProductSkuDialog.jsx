import { useId, useRef, useState } from 'react';
import Modal from '../common/Modal';
import { PageError } from '../common/PageLayout';
import { input, primary, secondary } from '../common/ui';
import { api } from '../../services/api';
import { GLASS_TYPES, UNITS_OF_MEASURE } from './productOptions';

export default function ProductSkuDialog({ product, onClose, onSaved }) {
  const prefix = useId();
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Controlled form values stay strings, including a zero price.
  // https://react.dev/reference/react-dom/components/input#controlling-an-input-with-a-state-variable
  const [form, setForm] = useState({
    skuCode: product?.skuCode || '', name: product?.name || '',
    glassType: product?.glassType || 'Float Glass', thicknessMm: String(product?.thicknessMm ?? ''),
    unitOfMeasure: product?.unitOfMeasure || 'SQ_METER',
    unitPrice: String(product?.unitPrice ?? ''), description: product?.description || ''
  });
  const change = event => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: name === 'skuCode' ? value.toUpperCase() : value }));
  };
  const close = () => { if (!submitting.current) onClose(); };
  async function save(event) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      if (product) await api.updateProduct(product.id, form);
      else await api.createProduct(form);
      onSaved(product ? 'Product SKU updated.' : 'Product SKU added.');
    } catch (failure) { setError(failure.message); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <Modal isOpen busy={busy} onClose={close} title={product ? `Edit product SKU · ${product.skuCode}` : 'Add Glass Product SKU'} subtitle="Specify glass category, nominal thickness, unit of measure, and pricing.">
    <form onSubmit={save} className="app-dialog-form">
      <fieldset disabled={busy} className="app-dialog-fields min-w-0 space-y-4">
        {error && <PageError message={error} />}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label htmlFor={`${prefix}-code`}>SKU Code *
            <input id={`${prefix}-code`} name="skuCode" required value={form.skuCode} onChange={change} className={`${input} mt-1`} placeholder="e.g. GL-TOUGH-10MM" />
          </label>
          <label htmlFor={`${prefix}-name`}>Product Name *
            <input id={`${prefix}-name`} name="name" required value={form.name} onChange={change} className={`${input} mt-1`} placeholder="e.g. 10mm Clear Toughened Glass" />
          </label>
          <label htmlFor={`${prefix}-type`}>Glass Type *
            <select id={`${prefix}-type`} name="glassType" required value={form.glassType} onChange={change} className={`${input} mt-1`}>
              {!GLASS_TYPES.includes(form.glassType) && <option value={form.glassType}>{form.glassType}</option>}
              {GLASS_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label htmlFor={`${prefix}-thickness`}>Nominal Thickness (mm) *
            <input id={`${prefix}-thickness`} name="thicknessMm" type="number" min="1" step="0.1" required value={form.thicknessMm} onChange={change} className={`${input} mt-1`} placeholder="e.g. 10 or 12" />
          </label>
          <label htmlFor={`${prefix}-unit`}>Unit of Measure *
            <select id={`${prefix}-unit`} name="unitOfMeasure" required value={form.unitOfMeasure} onChange={change} className={`${input} mt-1`}>
              {form.unitOfMeasure === 'SQ_FT' && <option value="SQ_FT">Square Feet (ft²)</option>}
              {UNITS_OF_MEASURE.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
            </select>
          </label>
          <label htmlFor={`${prefix}-price`}>Unit Base Price (₹) *
            <input id={`${prefix}-price`} name="unitPrice" type="number" min="0" step="0.01" required value={form.unitPrice} onChange={change} className={`${input} mt-1`} placeholder="e.g. 1850.00" />
          </label>
          <label htmlFor={`${prefix}-description`} className="sm:col-span-2">Description / Technical Notes
            <textarea id={`${prefix}-description`} name="description" rows={2} value={form.description} onChange={change} className={`${input} mt-1`} placeholder="Edge finishing, acoustic rating, or processing notes" />
          </label>
        </div>
      </fieldset>
      <div className="app-dialog-actions">
        <button type="button" disabled={busy} onClick={close} className={secondary}>Cancel</button>
        <button type="submit" disabled={busy} className={primary}>{busy ? 'Saving…' : product ? 'Save changes' : 'Add SKU to Catalog'}</button>
      </div>
    </form>
  </Modal>;
}

export function DeleteProductDialog({ product, onClose, onDeleted }) {
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const close = () => { if (!submitting.current) onClose(); };
  async function remove(event) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await api.deleteProduct(product.id);
      onDeleted('Product SKU deleted.');
    } catch (failure) { setError(failure.message); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <Modal isOpen busy={busy} onClose={close} title="Delete product SKU" subtitle="Remove an unused product from the catalog." maxWidth="max-w-lg">
    <form onSubmit={remove} className="app-dialog-form">
      <div className="app-dialog-fields space-y-4 text-sm">
        <p className="break-words">Delete <strong>{product.skuCode} · {product.name}</strong>? This action cannot be undone.</p>
        <p className="text-steel-600">Products used in quotations or sales orders cannot be deleted.</p>
        {error && <PageError message={error} />}
      </div>
      <div className="app-dialog-actions">
        <button type="button" disabled={busy} onClick={close} className={secondary}>Cancel</button>
        <button type="submit" disabled={busy} className={primary}>{busy ? 'Deleting…' : 'Delete product'}</button>
      </div>
    </form>
  </Modal>;
}
