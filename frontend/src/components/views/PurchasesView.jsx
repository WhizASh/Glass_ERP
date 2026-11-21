import PageLayout, { PageError } from '../common/PageLayout';
import { primary, secondary, input, rowAction } from '../common/ui';
import React, { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import PurchaseForm, { money, units } from '../purchases/PurchaseForm';
import { api } from '../../services/api';

const columns = [
  { header: 'Material', render: row => <div className="max-w-xs whitespace-normal break-words"><span className="font-semibold">{row.materialName}</span>{row.notes && <p className="mt-1 text-steel-500">{row.notes}</p>}</div> },
  { header: 'Date', render: row => new Date(row.purchaseDate).toLocaleDateString('en-IN', { timeZone: 'UTC' }) },
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
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
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
    <PageLayout title="Purchases" description="Material purchases, supplier costs and payment details." actions={<button type="button" onClick={() => { setMessage(''); setEditing(null); setModalOpen(true); }} className={primary}><Plus className="h-4 w-4" aria-hidden="true" />Add purchase</button>}>
      <form onSubmit={event => { event.preventDefault(); setPage(1); setQuery(search.trim()); }} className="flex flex-wrap items-end gap-2 text-sm">
        <label className="flex-1 min-w-0 font-medium text-steel-700">Search purchases
          <input type="search" maxLength={200} value={search} onChange={event => setSearch(event.target.value)} placeholder="Material or supplier" className={`${input} mt-1`} />
        </label>
        <button type="submit" className={secondary}>Search</button>
        {query && <button type="button" onClick={() => { setSearch(''); setQuery(''); setPage(1); }} className={secondary}>Clear</button>}
      </form>
      {message && <p role="status" className="text-xs text-teal-800">{message}</p>}
      {error ? <PageError message={error} onRetry={() => setRefresh(value => value + 1)} /> : <>
        <DataTable columns={[...columns, { header: 'Payment', render: row => <span>{row.paymentStatus || 'UNPAID'}<br />{money(row.amountPaid || 0)} paid</span> }, { header: 'Actions', render: row => <button type="button" onClick={() => { setEditing(row); setModalOpen(true); }} className={rowAction}>Edit</button> }]} data={data.records} loading={loading} tableAriaLabel="Purchase records" emptyMessage={query ? 'No matching purchases' : 'No purchases recorded yet'} emptySubtext={query ? 'Try another material or supplier name.' : 'Use Add Purchase to record your first material purchase.'} />
        {!loading && data.total > 0 && <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-steel-600">
          <p role="status">{(page - 1) * data.pageSize + 1}–{Math.min(page * data.pageSize, data.total)} of {data.total} purchases</p>
          <div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => setPage(value => value - 1)} className={secondary}>Previous</button><button type="button" disabled={page * data.pageSize >= data.total} onClick={() => setPage(value => value + 1)} className={secondary}>Next</button></div>
        </div>}
      </>}
      <Modal isOpen={modalOpen} busy={busy} onClose={close} title={editing ? 'Edit purchase' : 'Add purchase'} subtitle="Record material quantities and purchase costs.">
        {modalOpen && <PurchaseForm purchase={editing} onSaved={saved} onClose={close} onSavingChange={value => { saving.current = value; setBusy(value); }} />}
      </Modal>
    </PageLayout>
  );
}
