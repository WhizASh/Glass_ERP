import PageLayout, { PageError } from '../common/PageLayout';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import { primary, secondary, rowAction } from '../common/ui';
import React, { useEffect, useState } from 'react';
import { Plus, Printer, Pencil } from 'lucide-react';
import { api } from '../../services/api';
import SaleOrderItems from '../sales/SaleOrderItems';
import { calculateItemSqft, calculateDiscount } from '../../lib/glassCalculations';

const currency = value => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const blankItem = sectionName => ({ sectionName, description: '', productSkuId: '', widthInches: '', heightInches: '', areaSqFt: '', quantity: 1, unitPrice: 0 });
const area = item => item.widthInches && item.heightInches ? calculateItemSqft(Number(item.widthInches), Number(item.heightInches)) * (Number(item.quantity) || 1) : (Number(item.areaSqFt) || 0) * (Number(item.quantity) || 1);
const lineTotal = item => area(item) * (Number(item.unitPrice) || 0);
const fromSale = sale => ({ saleOrderId: sale.id, customerId: sale.customerId, issueDate: new Date().toISOString().slice(0, 10), discountType: sale.discountType || 'PERCENTAGE', discountValue: Number(sale.discountValue) || 0, taxRate: Number(sale.taxRate) || 0, notes: '', items: sale.items.map(item => ({ sectionName: item.sectionName || 'Section 1', description: item.description || item.productSku?.name || '', productSkuId: item.productSkuId || '', widthInches: item.widthInches ?? '', heightInches: item.heightInches ?? '', areaSqFt: item.areaSqFt ?? '', quantity: Number(item.quantity) || 1, unitPrice: Number(item.unitPrice) || 0 })) });

export default function TaxInvoicesView() {
  const [invoices, setInvoices] = useState([]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [printing, setPrinting] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const refresh = () => { setLoading(true); setListError(''); return api.getTaxInvoices().then(setInvoices).catch(err => setListError(err.message)).finally(() => setLoading(false)); };
  useEffect(() => { refresh(); Promise.all([api.getSales(), api.getCustomers(), api.getProducts()]).then(([s, c, p]) => { setSales(s); setCustomers(c); setProducts(p); }).catch(err => setError(err.message)); }, []);

  const selectSale = async id => {
    if (!id) { setForm(null); return; }
    try { setForm(fromSale(await api.getSaleById(id))); setError(''); }
    catch (err) { setError(err.message); }
  };
  const change = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const updateItem = (index, field, value) => setForm(current => ({ ...current, items: current.items.map((item, i) => {
    if (i !== index) return item;
    if (field === 'productSkuId') {
      const product = products.find(candidate => candidate.id === value);
      return product ? { ...item, productSkuId: value, description: product.name, unitPrice: Number(product.unitPrice) || 0 } : { ...item, productSkuId: value };
    }
    return { ...item, [field]: value };
  }) }));
  const addSection = () => setForm(current => { const names = new Set(current.items.map(item => item.sectionName)); let n = 1; while (names.has(`Section ${n}`)) n++; return { ...current, items: [...current.items, blankItem(`Section ${n}`)] }; });
  const addItemToSection = indices => setForm(current => { const items = [...current.items]; const last = indices.at(-1); items.splice(last + 1, 0, blankItem(items[last].sectionName)); return { ...current, items }; });
  const subtotal = form?.items.reduce((sum, item) => sum + lineTotal(item), 0) || 0;
  const discount = calculateDiscount(subtotal, form?.discountType || 'PERCENTAGE', Number(form?.discountValue) || 0);
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * (Number(form?.taxRate) || 0) / 100;
  const save = async event => {
    event.preventDefault(); setError(''); setSaving(true);
    try {
      if (editing) await api.updateTaxInvoice(editing.id, form);
      else await api.createTaxInvoice(form);
      setForm(null); setEditing(null); await refresh();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const startEdit = invoice => { setEditing(invoice); setForm({ ...invoice.data, customerId: invoice.customerId, saleOrderId: invoice.saleOrderId, issueDate: invoice.issueDate.slice(0, 10) }); setError(''); };
  const columns = [
    { header: 'Invoice', render: invoice => <strong className="font-semibold text-teal-800">{invoice.invoiceNumber}</strong> },
    { header: 'Date', render: invoice => new Date(invoice.issueDate).toLocaleDateString('en-IN', { timeZone: 'UTC' }) },
    { header: 'Sales order', render: invoice => invoice.saleOrder.orderNumber },
    { header: 'Customer', render: invoice => invoice.data.customer.companyName || invoice.data.customer.name },
    { header: 'Amount', align: 'right', render: invoice => <strong className="whitespace-nowrap font-semibold">{currency(invoice.data.totalAmount)}</strong> },
    { header: 'Actions', render: invoice => <div className="flex flex-wrap gap-1"><button type="button" onClick={() => startEdit(invoice)} className={rowAction} aria-label={`Edit ${invoice.invoiceNumber}`}><Pencil className="h-4 w-4" aria-hidden="true" />Edit</button><button type="button" onClick={() => setPrinting(invoice)} className={rowAction} aria-label={`Print ${invoice.invoiceNumber}`}><Printer className="h-4 w-4" aria-hidden="true" />Print</button></div> }
  ];
  return <PageLayout title="Tax invoices" description="Create, edit and print invoices from sales orders." actions={<button type="button" onClick={() => { setEditing(null); setForm({ saleOrderId: '', items: [] }); setError(''); }} className={primary}><Plus className="h-4 w-4" aria-hidden="true" />Create tax invoice</button>}>
    {error && !form && <PageError message={error} />}
    {listError ? <PageError message={listError} onRetry={refresh} /> : <DataTable columns={columns} data={invoices} loading={loading} tableAriaLabel="Tax invoices" emptyMessage="No tax invoices yet" emptySubtext="Create an invoice from a sales order to get started." />}
    {form && <Modal isOpen busy={saving} onClose={() => setForm(null)} title={editing ? `Edit ${editing.invoiceNumber}` : 'Create tax invoice'} subtitle="Choose a sales order, then review the customer, glass items and totals." maxWidth="max-w-5xl">
      <form onSubmit={save} className="app-dialog-form">
        <div className="app-dialog-fields space-y-4">
{!editing && <label className="block text-sm font-medium">Sale order *<select required value={form.saleOrderId} onChange={event => selectSale(event.target.value)} className="mt-1 w-full rounded border p-2"><option value="">Select a sale order</option>{sales.map(sale => <option key={sale.id} value={sale.id}>{sale.orderNumber} · {sale.customer?.companyName || sale.customer?.name}</option>)}</select></label>}{form.items?.length > 0 && <><div className="grid gap-3 sm:grid-cols-3"><label className="text-sm">Customer *<select required value={form.customerId} onChange={event => change('customerId', event.target.value)} className="mt-1 w-full rounded border p-2">{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.companyName || customer.name}</option>)}</select></label><label className="text-sm">Invoice date *<input required type="date" value={form.issueDate} onChange={event => change('issueDate', event.target.value)} className="mt-1 w-full rounded border p-2" /></label><label className="text-sm">Tax rate (%)<input type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={event => change('taxRate', event.target.value)} className="mt-1 w-full rounded border p-2" /></label></div><SaleOrderItems items={form.items} products={products} onAddSection={addSection} onAddItemToSection={addItemToSection} onRemoveSection={indices => setForm(current => ({ ...current, items: current.items.filter((_, i) => !indices.includes(i)) }))} onRenameSection={(indices, name) => setForm(current => ({ ...current, items: current.items.map((item, i) => indices.includes(i) ? { ...item, sectionName: name } : item) }))} onRemove={index => setForm(current => ({ ...current, items: current.items.filter((_, i) => i !== index) }))} onUpdate={updateItem} getSqft={area} getLineTotal={lineTotal} /><div className="grid gap-3 sm:grid-cols-3"><label className="text-sm">Discount type<select value={form.discountType} onChange={event => change('discountType', event.target.value)} className="mt-1 w-full rounded border p-2"><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed amount</option></select></label><label className="text-sm">Discount<input type="number" min="0" step="0.01" value={form.discountValue} onChange={event => change('discountValue', event.target.value)} className="mt-1 w-full rounded border p-2" /></label><div className="text-right text-sm">Subtotal {currency(subtotal)}<br />Discount {currency(discount)}<br />GST {currency(tax)}<br /><strong className="text-base">Total {currency(taxable + tax)}</strong></div></div><label className="block text-sm">Terms and notes<textarea value={form.notes || ''} onChange={event => change('notes', event.target.value)} className="mt-1 w-full rounded border p-2" rows="3" /></label></>}
          {error && <PageError message={error} />}
        </div>
        <div className="app-dialog-actions"><button type="button" disabled={saving} onClick={() => setForm(null)} className={secondary}>Cancel</button><button type="submit" disabled={saving || !form.items?.length} className={primary}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create invoice'}</button></div>
      </form>
    </Modal>}
    {printing && <div className="invoice-print-overlay fixed inset-0 z-[60] overflow-y-auto bg-steel-950/70 p-3" role="dialog" aria-modal="true" aria-label="Tax invoice preview"><div className="invoice-print-actions mx-auto mb-3 flex max-w-4xl justify-end gap-2"><button onClick={() => window.print()} className={primary}>Print / Save PDF</button><button onClick={() => setPrinting(null)} className={secondary}>Close</button></div><article className="invoice-print-sheet mx-auto min-h-[297mm] max-w-4xl bg-white p-8 text-slate-900 shadow-lg sm:p-12"><div className="border-b-2 border-slate-800 pb-5"><div className="flex justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-slate-500">Glass ERP</p><h2 className="mt-1 text-3xl font-bold">TAX INVOICE</h2></div><div className="text-right text-sm"><strong>{printing.invoiceNumber}</strong><p>Date: {printing.issueDate.slice(0, 10)}</p><p>Sale order: {printing.saleOrder.orderNumber}</p></div></div></div><div className="grid grid-cols-2 gap-6 border-b py-6 text-sm"><div><p className="mb-2 text-xs font-semibold uppercase text-slate-500">Bill to</p><strong>{printing.data.customer.companyName || printing.data.customer.name}</strong><p>{printing.data.customer.address}</p><p>{printing.data.customer.city}</p>{printing.data.customer.taxId && <p>GSTIN: {printing.data.customer.taxId}</p>}</div></div><table className="mt-6 w-full text-left text-sm"><thead className="border-y-2 border-slate-800"><tr><th className="py-2">Glass specification</th><th className="py-2 text-right">Size (in)</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Area (sqft)</th><th className="py-2 text-right">Rate</th><th className="py-2 text-right">Amount</th></tr></thead><tbody>{printing.data.items.map((item, i) => <React.Fragment key={i}>{(i === 0 || item.sectionName !== printing.data.items[i - 1].sectionName) && <tr className="bg-slate-100"><td colSpan="6" className="px-2 py-2 font-semibold">{item.sectionName}</td></tr>}<tr className="border-b"><td className="py-2">{item.description}</td><td className="py-2 text-right">{item.widthInches && item.heightInches ? `${item.widthInches} × ${item.heightInches}` : '—'}</td><td className="py-2 text-right">{item.quantity}</td><td className="py-2 text-right">{(item.areaSqFt * item.quantity).toFixed(2)}</td><td className="py-2 text-right">{currency(item.unitPrice)}</td><td className="py-2 text-right">{currency(item.totalPrice)}</td></tr></React.Fragment>)}</tbody></table><div className="ml-auto mt-6 w-64 space-y-2 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{currency(printing.data.subtotal)}</span></div><div className="flex justify-between"><span>Discount</span><span>{currency(printing.data.discountAmount)}</span></div><div className="flex justify-between"><span>Taxable amount</span><span>{currency(printing.data.taxableAmount)}</span></div><div className="flex justify-between"><span>GST ({printing.data.taxRate}%)</span><span>{currency(printing.data.taxAmount)}</span></div><div className="flex justify-between border-t-2 border-slate-800 pt-2 text-base font-bold"><span>Total</span><span>{currency(printing.data.totalAmount)}</span></div></div>{printing.data.notes && <div className="mt-12 border-t pt-4 text-sm"><strong>Terms and notes</strong><p className="whitespace-pre-wrap">{printing.data.notes}</p></div>}<div className="mt-20 border-t pt-4 text-right text-sm">Authorized signatory</div></article></div>}
  </PageLayout>;
}
