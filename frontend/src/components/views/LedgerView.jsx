import PageLayout, { PageError } from '../common/PageLayout';
import { primary } from '../common/ui';
import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, Search } from 'lucide-react';
import { api } from '../../services/api';
import LedgerTables, { formatMoney } from '../ledger/LedgerTables';
import ReceiptForm from '../ledger/ReceiptForm';

export default function LedgerView() {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('all');
  const [customerLoading, setCustomerLoading] = useState(true);
  const [customerError, setCustomerError] = useState('');
  const [ledger, setLedger] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    setCustomerLoading(true);
    const timer = setTimeout(() => {
      api.getLedgerParties().then(data => {
        if (active) { setCustomers(data.filter(row => `${row.name} ${row.companyName || ''} ${row.employeeCode || ''}`.toLowerCase().includes(query.toLowerCase()))); setCustomerError(''); }
      }).catch(err => { if (active) setCustomerError(err.message); })
        .finally(() => { if (active) setCustomerLoading(false); });
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [query, revision]);

  // Ignore superseded requests when switching parties, as recommended by React:
  // https://react.dev/reference/react/useEffect#fetching-data-with-effects
  useEffect(() => {
    if (!customerId) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setLedger(null);
    api.getLedger(customerId, controller.signal).then(data => {
      if (!controller.signal.aborted) setLedger(data);
    }).catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [customerId, revision]);

  const chooseCustomer = id => {
    if (id === customerId) return;
    setCustomerId(id);
    setLedger(null);
    setError('');
    setNotice('');
    setReceiptOpen(false);
  };
  const currentLedger = ledger?.customer.id === customerId ? ledger : null;
  const credit = currentLedger && Number(currentLedger.totals.balanceReceivable) < 0;
  return (
    <PageLayout title="Party ledger" description="Sales, purchases, payroll and payments." actions={<button type="button" disabled={!currentLedger || loading || customerId === 'all' || customerId.startsWith('supplier:') || customerId.startsWith('employee:')} onClick={() => setReceiptOpen(true)} className={primary}><Plus className="h-4 w-4" aria-hidden="true" />Record receipt</button>}>
      <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="self-start rounded-lg border border-steel-200 bg-white p-4">
          <label htmlFor="ledger-search" className="text-xs font-semibold text-steel-700">Search parties</label>
          <div className="relative mt-2"><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-steel-400" aria-hidden="true" /><input id="ledger-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, company or employee code" className="min-h-11 w-full rounded-md border border-steel-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" /></div>
          {customerLoading ? <p role="status" className="mt-4 text-xs text-steel-500">Loading parties…</p> : customerError ? <div className="mt-4 text-xs text-red-800" role="alert"><p>{customerError}</p><button className="mt-2 min-h-11 underline" onClick={() => setRevision(value => value + 1)}>Retry party search</button></div> : <>
            <p className="mb-2 mt-4 text-xs text-steel-500">{customers.length} {customers.length === 1 ? 'party' : 'parties'}</p>
            <button type="button" aria-pressed={customerId === 'all'} onClick={() => chooseCustomer('all')} className={`mb-2 min-h-11 w-full rounded-md border px-3 text-left text-sm font-semibold ${customerId === 'all' ? 'border-teal-300 bg-teal-50 text-teal-900' : 'border-steel-200'}`}>All parties</button>
            <div className="max-h-60 space-y-1 overflow-y-auto lg:max-h-[32rem]" aria-label="Select a party">
              {customers.map(customer => <button type="button" key={customer.id} aria-pressed={customerId === customer.id} onClick={() => chooseCustomer(customer.id)} className={`min-h-11 w-full break-words rounded-md border px-3 py-2.5 text-left text-xs transition-colors ${customerId === customer.id ? 'border-teal-300 bg-teal-50 text-teal-900' : 'border-transparent text-steel-700 hover:bg-steel-50'}`}><span className="block font-semibold">{customer.companyName || customer.name}</span><span className="mt-1 block text-steel-500">{customer.type}{customer.city ? ` · ${customer.city}` : ''}</span><span className="mt-1 block text-[10px] text-steel-500">{customer.phone || `ID: ${customer.id}`}</span></button>)}
              {!customers.length && <p role="status" className="py-4 text-xs text-steel-500">No parties found. Try another name or add a customer in Customers.</p>}
            </div>
          </>}
        </aside>
        <div className="min-w-0 space-y-4">
          {notice && <p role="status" className="rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">{notice}</p>}
          {!customerId ? <div className="rounded-lg border border-steel-200 bg-white px-6 py-20 text-center"><BookOpen className="mx-auto mb-4 h-8 w-8 text-steel-400" aria-hidden="true" /><h2 className="text-sm font-semibold">Select a party to view their ledger</h2><p className="mt-2 text-xs text-steel-500">Search the customer directory to get started.</p></div> : loading ? <div role="status" aria-busy="true" className="space-y-4"><p className="text-sm text-steel-500">Loading ledger…</p><div className="h-32 animate-pulse rounded-lg bg-steel-200 motion-reduce:animate-none" /><div className="h-60 animate-pulse rounded-lg bg-steel-200 motion-reduce:animate-none" /></div> : error ? <div role="alert" className="rounded-lg border border-red-200 bg-white p-5"><p className="text-sm text-red-800">{error}</p><button onClick={() => setRevision(value => value + 1)} className="mt-3 min-h-11 rounded-md border border-steel-300 px-4 text-sm hover:bg-steel-50">Retry ledger</button></div> : currentLedger && <>
            <section className="overflow-hidden rounded-lg border border-steel-200 bg-white">
              <div className="border-b border-steel-200 px-4 py-4"><p className="text-xs font-medium uppercase tracking-wide text-steel-500">Party name</p><h2 className="mt-1 break-words text-lg font-semibold">{currentLedger.customer.companyName || currentLedger.customer.name}</h2><p className="mt-1 text-xs text-steel-500">All-time statement · INR</p></div>
              <dl className="grid grid-cols-1 divide-y divide-steel-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">{(currentLedger.customer.type === 'Employee' ? [['Payroll accrued', currentLedger.totals.payrollAccrued]] : [['Total sales', currentLedger.totals.saleAmount], ['Amount received', currentLedger.totals.amountReceived], [credit ? 'Customer credit' : 'Balance receivable', currentLedger.totals.balanceReceivable]]).map(([label, value], index) => <div key={label} className={`min-w-0 p-4 ${index === 2 ? 'bg-teal-50' : ''}`}><dt className="text-xs text-steel-600">{label}</dt><dd className={`mt-2 break-words text-lg font-semibold tabular-nums ${index === 2 ? 'text-teal-900' : 'text-steel-900'}`}>{formatMoney(value)}</dd></div>)}</dl>
            </section>
            {currentLedger.hasUnknownPartialPayments && <p role="note" className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">Some older sales have Partial status without a recorded amount. Edit those sales and enter the actual amount received to complete this ledger.</p>}
            <LedgerTables outflow={currentLedger.outflow} inflow={currentLedger.inflow} totals={currentLedger.totals} />
            <p className="text-xs leading-relaxed text-steel-500">Sales, purchases and saved payroll update this ledger automatically. Outflow: sales charges and supplier payments. Inflow: purchase bills, customer payments and accrued net payroll. Payroll dates show when the run was saved; payroll payments are not tracked here.</p>
          </>}
        </div>
      </div>
      {receiptOpen && currentLedger && <ReceiptForm customer={currentLedger.customer} sales={currentLedger.sales} onClose={() => setReceiptOpen(false)} onSaved={() => { setReceiptOpen(false); setNotice('Receipt recorded successfully.'); setRevision(value => value + 1); }} />}
    </PageLayout>
  );
}
