import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import PageLayout, { FilterTabs, PageError } from '../common/PageLayout';
import { primary, rowAction } from '../common/ui';
import DataTable from '../common/DataTable';
import ProductSkuDialog, { DeleteProductDialog } from '../products/ProductSkuDialog';
import { GLASS_TYPES, UNITS_OF_MEASURE } from '../products/productOptions';
import { api } from '../../services/api';

export default function ProductSKUsView() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [selectedGlassType, setSelectedGlassType] = useState('ALL');
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setListError('');
    const params = selectedGlassType === 'ALL' ? {} : { glassType: selectedGlassType };
    api.getProducts(params, controller.signal).then(data => {
      if (!controller.signal.aborted) setProducts(data);
    }).catch(error => {
      if (!controller.signal.aborted) setListError(error.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [selectedGlassType, revision]);

  function saved(message) {
    setEditor(null);
    setDeleting(null);
    setNotice(message);
    setRevision(value => value + 1);
  }
  const add = () => { setNotice(''); setEditor({ product: null }); };
  const columns = [
    { header: 'SKU Code', render: row => <span className="break-words text-sm font-semibold text-teal-800">{row.skuCode}</span> },
    { header: 'Product Name', render: row => <div className="break-words"><span className="font-semibold text-steel-900">{row.name}</span>{row.description && <span className="block text-xs font-normal text-steel-500">{row.description}</span>}</div> },
    { header: 'Glass Category', render: row => <span className="inline-flex items-center rounded border border-steel-200 bg-steel-100 px-2 py-0.5 text-xs font-medium text-steel-700">{row.glassType}</span> },
    { header: 'Thickness', align: 'right', render: row => <span className="text-sm font-semibold tabular-nums text-steel-800">{Number(row.thicknessMm)} mm</span> },
    { header: 'Unit Basis', render: row => <span className="text-xs font-medium text-steel-600">{UNITS_OF_MEASURE.find(unit => unit.value === (row.unitOfMeasure === 'SQ_FT' ? 'SQ_FEET' : row.unitOfMeasure))?.label || row.unitOfMeasure}</span> },
    { header: 'Base Rate', align: 'right', render: row => <span className="text-sm font-semibold tabular-nums text-steel-900">₹{Number(row.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> },
    { header: 'Actions', render: row => <div className="flex flex-wrap gap-1">
      <button type="button" onClick={() => { setNotice(''); setEditor({ product: row }); }} aria-label={`Edit product ${row.skuCode}`} className={rowAction}>Edit</button>
      <button type="button" onClick={() => { setNotice(''); setDeleting(row); }} aria-label={`Delete product ${row.skuCode}`} className={rowAction}>Delete</button>
    </div> }
  ];
  return <PageLayout title="Product SKUs" description="Glass specifications, categories and base rates." actions={<button type="button" onClick={add} className={primary}><Plus className="h-4 w-4" aria-hidden="true" />Add product SKU</button>}>
    <FilterTabs label="Glass category" value={selectedGlassType} onChange={setSelectedGlassType} options={['ALL', ...GLASS_TYPES].map(value => ({ value, label: value === 'ALL' ? 'All glass' : value }))} />
    {notice && <p role="status" className="rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">{notice}</p>}
    {listError ? <PageError message={listError} onRetry={() => setRevision(value => value + 1)} /> : <DataTable
      columns={columns} data={products} loading={loading} tableAriaLabel="Glass Product Catalog Table"
      emptyMessage={selectedGlassType === 'ALL' ? 'No product SKUs cataloged yet' : 'No products in this glass category'}
      emptySubtext="Define your glass specifications and base rates per unit (m², ft², KG, PCS)."
      actionButton={<button type="button" onClick={add} className={primary}><Plus className="h-4 w-4" aria-hidden="true" />Add product SKU</button>} />}
    {editor && <ProductSkuDialog {...editor} onClose={() => setEditor(null)} onSaved={saved} />}
    {deleting && <DeleteProductDialog product={deleting} onClose={() => setDeleting(null)} onDeleted={saved} />}
  </PageLayout>;
}
