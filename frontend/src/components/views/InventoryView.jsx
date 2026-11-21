import { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import DataTable from '../common/DataTable';
import InventoryDialog from '../inventory/InventoryDialog';
import { materialUnits } from '../../lib/materialUnits';
import { api } from '../../services/api';

const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-steel-300 bg-white px-3 text-xs font-semibold text-steel-700 hover:bg-steel-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:opacity-50';

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
      <button type="button" onClick={() => setEditor({ item })} aria-label={`Edit ${item.materialName}`} className={button}>Edit</button>
      <button type="button" onClick={() => setEditor({ item, deleting: true })} aria-label={`Delete ${item.materialName}`} disabled={Boolean(item._count.purchases)} title={item._count.purchases ? 'Linked to purchases. Edit the quantity to adjust stock.' : undefined} className={button}>Delete</button>
    </div> }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-steel-200 bg-white p-4">
        <div><h1 className="text-lg font-semibold tracking-tight">Inventory</h1><p className="mt-1 text-xs text-steel-600">Available raw materials, grouped by material and unit.</p></div>
        <button type="button" onClick={() => { setNotice(''); setEditor({ item: null }); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-xs font-semibold text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"><Plus className="h-4 w-4" aria-hidden="true" />Add item</button>
      </div>
      <form onSubmit={event => { event.preventDefault(); setQuery(search.trim()); setPage(1); }} className="flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1 text-xs font-semibold text-steel-700">Search inventory
          <input type="search" maxLength={200} value={search} onChange={event => setSearch(event.target.value)} placeholder="Material name" className="mt-1 block min-h-11 w-full rounded-md border border-steel-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
        </label>
        <button type="submit" className={button}>Search</button>
        {query && <button type="button" onClick={() => { setSearch(''); setQuery(''); setPage(1); }} className={button}>Clear</button>}
        <button type="button" disabled={loading} onClick={() => setRevision(value => value + 1)} className={button}><RefreshCw className="h-4 w-4" aria-hidden="true" />Refresh</button>
      </form>
      {notice && <p role="status" className="rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">{notice}</p>}
      {loading && <p role="status" className="text-xs text-steel-600">Loading inventory…</p>}
      {error ? <div role="alert" className="rounded-md border border-rose-200 bg-white p-4 text-sm text-rose-700"><p>{error}</p><button type="button" onClick={() => setRevision(value => value + 1)} className={`${button} mt-3`}>Retry</button></div> : <>
        <DataTable columns={columns} data={data.records} loading={loading} tableAriaLabel="Raw material inventory" emptyMessage={query ? 'No matching inventory items' : 'No inventory items yet'} emptySubtext={query ? 'Try another material name.' : 'Add an item or record a purchase to start tracking stock.'} />
        {!loading && data.total > 0 && <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-steel-600">
          <p role="status">{(page - 1) * data.pageSize + 1}–{Math.min(page * data.pageSize, data.total)} of {data.total} items</p>
          <div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => setPage(value => value - 1)} className={button}>Previous</button><button type="button" disabled={page * data.pageSize >= data.total} onClick={() => setPage(value => value + 1)} className={button}>Next</button></div>
        </div>}
      </>}
      <p className="text-xs leading-relaxed text-steel-600">Purchases update stock automatically, including changes to purchase quantities. Record used or damaged stock by editing the available quantity. Items linked to purchases cannot be deleted.</p>
      {editor && <InventoryDialog {...editor} onClose={() => setEditor(null)} onSaved={saved} />}
    </div>
  );
}
