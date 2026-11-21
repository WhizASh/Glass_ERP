import React from 'react';

export const formatMoney = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value);
const formatDate = value => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: '2-digit', timeZone: 'UTC' }).format(new Date(value));
export const paymentLabels = { CASH: 'Cash', NEFT: 'NEFT', UPI: 'UPI', CARD: 'Card', CHEQUE: 'Cheque', OTHER: 'Other' };
const cell = 'px-4 py-3 text-left align-top';

function TransactionTable({ title, count, headers, children, empty, total }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-steel-200 bg-white">
      <div className="flex items-center justify-between gap-3 bg-steel-900 px-4 py-3 text-white">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="rounded bg-steel-700 px-2 py-0.5 text-xs tabular-nums">{count}</span>
      </div>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={`${title} transactions`}>
        <table className="w-full text-sm">
          <caption className="sr-only">{title}</caption>
          <thead className="border-b border-steel-200 bg-steel-50 text-steel-600"><tr>{headers.map((header, i) => <th scope="col" key={header} className={`${cell} font-medium ${i === headers.length - 1 ? '!text-right' : ''}`}>{header}</th>)}</tr></thead>
          <tbody className="divide-y divide-steel-100">{count ? children : <tr><td colSpan={headers.length} className="px-4 py-12 text-center text-steel-500">{empty}</td></tr>}</tbody>
          <tfoot className="border-t border-steel-200 bg-steel-50 font-semibold"><tr><th scope="row" colSpan={headers.length - 1} className={cell}>Total</th><td className={`${cell} !text-right whitespace-nowrap tabular-nums`}>{formatMoney(total)}</td></tr></tfoot>
        </table>
      </div>
    </section>
  );
}

export default function LedgerTables({ outflow = [], inflow = [], totals }) {
  const rows = entries => entries.map(entry => (
    <tr key={entry.id} className="hover:bg-steel-50">
      <td className={`${cell} whitespace-nowrap`}>{entry.date ? formatDate(entry.date) : 'Not recorded'}</td>
      <td className={cell}><span className="font-medium">{entry.kind}</span><span className="mt-1 block text-steel-500">{entry.party}</span></td>
      <td className={`${cell} break-words`}>{entry.reference || '—'}{entry.paymentMode && entry.kind !== 'Sale' && entry.kind !== 'Purchase' && <span className="mt-1 block text-steel-500">{entry.paymentMode === 'ONLINE' ? 'NEFT / UPI / Card' : paymentLabels[entry.paymentMode] || entry.paymentMode}</span>}</td>
      <td className={`${cell} !text-right whitespace-nowrap tabular-nums`}>{formatMoney(entry.amount)}</td>
    </tr>
  ));
  return (
    <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-2">
      <TransactionTable title="Outflow / debit details" count={outflow.length} headers={['Date', 'Transaction / party', 'Reference', 'Amount']} empty="No outflow entries." total={totals.outflow}>
        {rows(outflow)}
      </TransactionTable>
      <TransactionTable title="Inflow / credit details" count={inflow.length} headers={['Date', 'Transaction / party', 'Reference', 'Amount']} empty="No inflow entries." total={totals.inflow}>
        {rows(inflow)}
      </TransactionTable>
    </div>
  );
}
