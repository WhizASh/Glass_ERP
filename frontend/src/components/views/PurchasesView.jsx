import React, { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import PurchaseForm, { money, units } from '../purchases/PurchaseForm';
import { api } from '../../services/api';

const columns = [
  { header: 'Date', render: row => new Date(row.purchaseDate).toLocaleDateString('en-IN', { timeZone: 'UTC' }) },
  { header: 'Material', render: row => <div className="max-w-xs whitespace-normal break-words"><span className="font-semibold">{row.materialName}</span>{row.notes && <p className="mt-1 text-steel-500">{row.notes}</p>}</div> },
  { header: 'Supplier', render: row => <span className="block max-w-48 whitespace-normal break-words">{row.supplier || '—'}</span> },
  { header: 'Quantity', align: 'right', render: row => `${Number(row.quantity).toLocaleString('en-IN')} ${units[row.unitOfMeasure]}` },
  { header: 'Unit price', align: 'right', render: row => money(row.unitPrice) },
  { header: 'Additional costs', align: 'right', render: row => money(row.additionalCost) },
  { header: 'Total cost', align: 'right', render: row => <span className="font-bold">{money(row.totalCost)}</span> }
];

export default function PurchasesView() {
  const [data, setData] = useState({ records: [], total: 0, pageSize: 25 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const saving = useRef(false);
  const [message, setMessage] = useState('');

  // Ignore obsolete responses when changing pages, retrying, or leaving the tab.
  // https://react.dev/reference/react/useEffect#fetching-data-with-effects
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');
    api.getPurchases({ q: query, page }).then(result => {
      if (!ignore) setData(result);
    }).catch(err => {
      if (!ignore) setError(err.message);
    }).finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [query, page, refresh]);

  const close = () => { if (!saving.current) setModalOpen(false); };
  const saved = () => {
    setModalOpen(false);
    setMessage('Purchase saved.');
    setPage(1);
    setQuery('');
    setSearch('');
    setRefresh(value => value + 1);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-steel-200 p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h2 className="text-sm font-bold text-steel-900">Purchase register</h2><p className="text-xs text-steel-500 mt-1">Glass materials and purchase costs for manufacturing.</p></div>
        <button type="button" onClick={() => { setMessage(''); setModalOpen(true); }} className="min-h-11 sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white shrink-0">
          <Plus className="w-3.5 h-3.5" /> Add Purchase
        </button>
      </div>
      <form onSubmit={event => { event.preventDefault(); setPage(1); setQuery(search.trim()); }} className="flex flex-wrap items-end gap-2 text-xs">
        <label className="flex-1 min-w-0 font-semibold text-steel-700">Search purchases
          <input type="search" maxLength={200} value={search} onChange={event => setSearch(event.target.value)} placeholder="Material or supplier" className="min-h-11 sm:min-h-0 block mt-1 w-full rounded-md border border-steel-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-edge-600" />
        </label>
        <button type="submit" className="min-h-11 sm:min-h-0 rounded-md border border-steel-300 bg-white px-3 py-2 font-semibold">Search</button>
        {query && <button type="button" onClick={() => { setSearch(''); setQuery(''); setPage(1); }} className="min-h-11 sm:min-h-0 rounded-md border border-steel-300 bg-white px-3 py-2">Clear</button>}
      </form>
      {message && <p role="status" className="text-xs text-teal-800">{message}</p>}
      {error ? <div role="alert" className="min-h-11 sm:min-h-0 rounded-md border border-rose-200 bg-white p-4 text-xs text-rose-700"><p>{error}</p><button type="button" onClick={() => setRefresh(value => value + 1)} className="mt-2 underline font-semibold">Retry</button></div> : <>
        <DataTable columns={columns} data={data.records} loading={loading} tableAriaLabel="Purchase records" emptyMessage={query ? 'No matching purchases' : 'No purchases recorded yet'} emptySubtext={query ? 'Try another material or supplier name.' : 'Use Add Purchase to record your first material purchase.'} />
        {!loading && data.total > 0 && <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-steel-600">
          <p role="status">{(page - 1) * data.pageSize + 1}–{Math.min(page * data.pageSize, data.total)} of {data.total} purchases</p>
          <div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => setPage(value => value - 1)} className="min-h-11 sm:min-h-0 px-3 py-2 border border-steel-300 bg-white rounded-md disabled:opacity-50">Previous</button><button type="button" disabled={page * data.pageSize >= data.total} onClick={() => setPage(value => value + 1)} className="min-h-11 sm:min-h-0 px-3 py-2 border border-steel-300 bg-white rounded-md disabled:opacity-50">Next</button></div>
        </div>}
      </>}
      <Modal isOpen={modalOpen} onClose={close} title="Add Purchase" subtitle="Record material quantities and purchase costs">
        {modalOpen && <PurchaseForm onSaved={saved} onClose={close} onSavingChange={value => { saving.current = value; }} />}
      </Modal>
    </div>
  );
}
