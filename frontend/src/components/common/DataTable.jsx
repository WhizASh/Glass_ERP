import { Inbox } from 'lucide-react';
import TableSkeleton from './TableSkeleton';

const content = (column, row) => column.render ? column.render(row) : row[column.accessor];
const alignment = align => align === 'right' ? 'text-right tabular-nums' : align === 'center' ? 'text-center' : 'text-left';

export default function DataTable({ columns = [], data = [], loading = false, emptyMessage = 'No records found', emptySubtext = 'Get started by creating a new entry above.', actionButton, tableAriaLabel = 'Data table', onRowClick, selectedRowId }) {
  if (loading) return <TableSkeleton ariaLabel={`Loading ${tableAriaLabel}`} rows={4} />;
  if (!data.length) return (
    <div className="rounded-lg border border-steel-200 bg-steel-50/50 px-4 py-12 text-center">
      <Inbox className="mx-auto mb-3 h-8 w-8 text-steel-400" aria-hidden="true" />
      <p className="text-sm font-semibold text-steel-900">{emptyMessage}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-steel-600">{emptySubtext}</p>
      {actionButton && <div className="mt-4 flex flex-wrap justify-center gap-2">{actionButton}</div>}
    </div>
  );
  const [name, ...fields] = columns;
  return <>
    <div role="region" aria-label={tableAriaLabel} tabIndex={0} className="hidden overflow-x-auto rounded-lg border border-steel-200 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 lg:block">
      <table className="w-full text-sm">
        <caption className="sr-only">{tableAriaLabel}</caption>
        <thead className="border-b border-steel-200 bg-steel-50 text-steel-600"><tr>{columns.map(column => <th key={column.header} scope="col" className={`whitespace-nowrap px-4 py-3 font-medium ${alignment(column.align)}`}>{column.header}</th>)}</tr></thead>
        <tbody className="divide-y divide-steel-100">{data.map((row, index) => <tr key={row.id || index} onClick={onRowClick ? () => onRowClick(row) : undefined} className={`${onRowClick ? 'cursor-pointer' : ''} ${selectedRowId === row.id ? 'bg-teal-50' : 'hover:bg-steel-50'}`}>
          {columns.map(column => <td key={column.header} className={`px-4 py-3 align-top text-steel-800 ${alignment(column.align)}`}>{content(column, row)}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
    <ul aria-label={tableAriaLabel} className="divide-y divide-steel-200 overflow-hidden rounded-lg border border-steel-200 lg:hidden">
      {data.map((row, index) => <li key={row.id || index} onClick={onRowClick ? () => onRowClick(row) : undefined} className={`min-w-0 p-4 ${selectedRowId === row.id ? 'bg-teal-50' : 'bg-white'}`}>
        <div className="break-words text-sm font-semibold">{content(name, row)}</div>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">{fields.map(column => <div key={column.header} className={`min-w-0 ${column.header === 'Actions' ? 'col-span-2 border-t border-steel-100 pt-2' : ''}`}>
          <dt className="text-xs text-steel-600">{column.header}</dt>
          <dd className="mt-1 break-words text-sm tabular-nums">{content(column, row)}</dd>
        </div>)}</dl>
      </li>)}
    </ul>
  </>;
}
