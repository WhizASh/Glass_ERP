import React from 'react';

/**
 * Reusable Table container with header styling, empty state, and responsive scroll wrapper.
 */
export default function Table({
  columns = [],
  data = [],
  renderRow,
  keyExtractor,
  emptyMessage = 'No records found',
  isLoading = false,
  className = '',
}) {
  return (
    <div className={`w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 font-semibold ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-sky-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Loading facility data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-sm font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                if (renderRow) {
                  return renderRow(item, index);
                }
                const key = keyExtractor ? keyExtractor(item, index) : item.id || index;
                return (
                  <tr
                    key={key}
                    className="hover:bg-slate-50/80 transition-colors odd:bg-white even:bg-slate-50/30"
                  >
                    {columns.map((col, cIdx) => (
                      <td
                        key={cIdx}
                        className={`px-4 py-3 ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        } ${col.cellClassName || ''}`}
                      >
                        {col.accessor
                          ? typeof col.accessor === 'function'
                            ? col.accessor(item)
                            : item[col.accessor]
                          : null}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
