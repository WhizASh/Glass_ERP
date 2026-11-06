import React from 'react';
import { Inbox } from 'lucide-react';

const DataTable = ({
  columns = [],
  data = [],
  emptyMessage = 'No records found',
  emptySubtext = 'Get started by creating a new entry above.',
  actionButton = null,
  tableAriaLabel = 'Data Table'
}) => {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={tableAriaLabel}
      className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
    >
      <div className="overflow-x-auto max-h-[600px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/80">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className={`px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white/50">
            {data && data.length > 0 ? (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  className="hover:bg-blue-50/40 transition-colors duration-150"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`px-5 py-3.5 text-sm text-slate-700 whitespace-nowrap ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-14 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 mb-3 border border-blue-100">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {emptyMessage}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {emptySubtext}
                    </p>
                    {actionButton && (
                      <div className="mt-4">
                        {actionButton}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
