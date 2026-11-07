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
      className="bg-white rounded-lg border border-steel-200 overflow-hidden shadow-xs focus:outline-none focus:ring-1 focus:ring-edge-600"
    >
      <div className="overflow-x-auto max-h-[600px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-steel-50 border-b border-steel-200 text-[11px] font-semibold text-steel-600 uppercase tracking-wider">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className={`px-4 py-2.5 ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-steel-100 text-xs">
            {data && data.length > 0 ? (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  className="hover:bg-steel-50/80 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`px-4 py-3 text-steel-800 whitespace-nowrap ${
                        col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-10 h-10 rounded-lg bg-steel-100 flex items-center justify-center text-steel-500 mb-2.5">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-steel-800">
                      {emptyMessage}
                    </p>
                    <p className="text-[11px] text-steel-500 mt-0.5">
                      {emptySubtext}
                    </p>
                    {actionButton && (
                      <div className="mt-3.5">
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
