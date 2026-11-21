import PageLayout, { PageError } from '../common/PageLayout';
import { primary, secondary, input, rowAction } from '../common/ui';
import { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import DataTable from '../common/DataTable';
import InventoryDialog from '../inventory/InventoryDialog';
import { materialUnits } from '../../lib/materialUnits';
import { api } from '../../services/api';

const button = secondary;

export default function InventoryView() {
  const [data, setData] = useState({ records: [], total: 0, pageSize: 25 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState(null);
  const [notice, setNotice] = useState('');

  // Abort obsolete requests when changing search/page or leaving the tab.
  // https://react.dev/reference/react/useEffect#fetching-data-with-effects
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api.getInventory({ q: query, page }, controller.signal).then(result => {
      if (!controller.signal.aborted) setData(result);
    }).catch(failure => { if (!controller.signal.aborted) setError(failure.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, page, revision]);

  function saved(message) {
    setEditor(null);
    setNotice(message);
    setPage(1);
    setRevision(value => value + 1);
  }
  const columns = [
    { header: 'Material', render: item => <div className="max-w-xs whitespace-normal break-words"><span className="font-semibold">{item.materialName}</span>{item.notes && <p className="mt-1 text-steel-500">{item.notes}</p>}</div> },
    { header: 'Available stock', align: 'right', render: item => <span className="font-semibold">{Number(item.quantity).toLocaleString('en-IN', { maximumFractionDigits: 3 })}</span> },
    { header: 'Unit', render: item => materialUnits[item.unitOfMeasure] },
    { header: 'Actions', render: item => <div className="flex gap-2">
      <button type="button" onClick={() => setEditor({ item })} aria-label={`Edit ${item.materialName}`} className={rowAction}>Edit</button>
      <button type="button" onClick={() => setEditor({ item, deleting: true })} aria-label={`Delete ${item.materialName}`} disabled={Boolean(item._count.purchases)} title={item._count.purchases ? 'Linked to purchases. Edit the quantity to adjust stock.' : undefined} className={rowAction}>Delete</button>
    </div> }
  ];

  return (
    <PageLayout title="Inventory" description="Available raw materials, grouped by material and unit." actions={<button type="button" onClick={() => { setNotice(''); setEditor({ item: null }); }} className={primary}><Plus className="h-4 w-4" aria-hidden="true" />Add item</button>}>
      <form onSubmit={event => { event.preventDefault(); setQuery(search.trim()); setPage(1); }} className="flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1 text-sm font-medium text-steel-700">Search inventory
          <input type="search" maxLength={200} value={search} onChange={event => setSearch(event.target.value)} placeholder="Material name" className={`${input} mt-1`} />
        </label>
        <button type="submit" className={button}>Search</button>
        {query && <button type="button" onClick={() => { setSearch(''); setQuery(''); setPage(1); }} className={button}>Clear</button>}
        <button type="button" disabled={loading} onClick={() => setRevision(value => value + 1)} className={button}><RefreshCw className="h-4 w-4" aria-hidden="true" />Refresh</button>
      </form>
      {notice && <p role="status" className="rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">{notice}</p>}
      {loading && <p role="status" className="text-xs text-steel-600">Loading inventory…</p>}
      {error ? <PageError message={error} onRetry={() => setRevision(value => value + 1)} /> : <>
        <DataTable columns={columns} data={data.records} loading={loading} tableAriaLabel="Raw material inventory" emptyMessage={query ? 'No matching inventory items' : 'No inventory items yet'} emptySubtext={query ? 'Try another material name.' : 'Add an item or record a purchase to start tracking stock.'} />
        {!loading && data.total > 0 && <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-steel-600">
          <p role="status">{(page - 1) * data.pageSize + 1}–{Math.min(page * data.pageSize, data.total)} of {data.total} items</p>
          <div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => setPage(value => value - 1)} className={button}>Previous</button><button type="button" disabled={page * data.pageSize >= data.total} onClick={() => setPage(value => value + 1)} className={button}>Next</button></div>
        </div>}
      </>}
      <p className="text-xs leading-relaxed text-steel-600">Purchases update stock automatically, including changes to purchase quantities. Record used or damaged stock by editing the available quantity. Items linked to purchases cannot be deleted.</p>
      {editor && <InventoryDialog {...editor} onClose={() => setEditor(null)} onSaved={saved} />}
    </PageLayout>
  );
}
