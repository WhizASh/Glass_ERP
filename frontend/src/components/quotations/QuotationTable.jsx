import React from 'react';
import { Eye, Inbox, FileText, Printer, Edit3 } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { formatCurrency, formatSqft, getItemDisplayMetrics } from '../../lib/glassCalculations';

const QuotationTable = ({
  quotations = [],
  loading = false,
  onSelectQuotation,
  onPrintQuotation,
  onEditQuotation,
  selectedQuotationId,
  onOpenCreateModal
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-steel-200 p-6 space-y-3" role="status" aria-busy="true" aria-label="Loading quotations">
        <div className="h-5 bg-steel-100 rounded w-1/4 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-steel-50 rounded border border-steel-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (quotations.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-steel-200 p-12 text-center">
        <div className="w-12 h-12 rounded-lg bg-steel-100 text-steel-500 mx-auto flex items-center justify-center mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-steel-800">No Quotations Found</h3>
        <p className="text-xs text-steel-500 mt-1 max-w-sm mx-auto">
          No architectural glass estimates match your search or filter criteria. Create a new quotation to get started.
        </p>
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="btn-primary mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-xs transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Create First Quotation</span>
        </button>
      </div>
    );
  }

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Quotations List"
      className="bg-white rounded-lg border border-steel-200 overflow-hidden shadow-xs focus:outline-none focus:ring-1 focus:ring-edge-600"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-steel-50 border-b border-steel-200 text-[11px] font-semibold text-steel-600 uppercase tracking-wider">
              <th className="py-2.5 px-3.5">Quote #</th>
              <th className="py-2.5 px-3.5">Customer / Company</th>
              <th className="py-2.5 px-3.5">Date</th>
              <th className="py-2.5 px-3.5">Sections / Floors</th>
              <th className="py-2.5 px-3.5 text-right">Glazing Area</th>
              <th className="py-2.5 px-3.5 text-right">Total Amount</th>
              <th className="py-2.5 px-3.5 text-center">Status</th>
              <th className="py-2.5 px-3.5 text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-steel-100 text-xs">
            {quotations.map((quote) => {
              const isSelected = selectedQuotationId === quote.id;

              // Compute total area in sqft using universal display metrics
              let quoteSqft = 0;
              (quote.sections || []).forEach((sec) => {
                const items = Array.isArray(sec.items) ? sec.items : (sec.items?.create || []);
                items.forEach((item) => {
                  const metrics = getItemDisplayMetrics(item);
                  quoteSqft += metrics.totalSqft;
                });
              });

              const sectionCount = quote.sections?.length || 0;

              return (
                <tr
                  key={quote.id}
                  onClick={() => onSelectQuotation(quote)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectQuotation(quote);
                    }
                  }}
                  tabIndex={0}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-edge-50/70 border-l-4 border-l-edge-600' : 'hover:bg-steel-50/80'
                  }`}
                >
                  {/* Quote # */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className="font-mono text-xs font-bold text-edge-800 bg-edge-50 px-2 py-0.5 rounded border border-edge-200">
                      {quote.quoteNumber}
                    </span>
                  </td>

                  {/* Customer / Company */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <div className="font-semibold text-steel-900">
                      {quote.customer?.companyName || quote.customer?.name || '—'}
                    </div>
                    {quote.customer?.companyName && quote.customer?.name && (
                      <div className="text-[11px] text-steel-500 font-normal">
                        Attn: {quote.customer.name} {quote.customer?.city ? `· ${quote.customer.city}` : ''}
                      </div>
                    )}
                  </td>

                  {/* Date */}
                  <td className="py-3 px-3.5 whitespace-nowrap font-mono text-steel-600">
                    {quote.issueDate || quote.createdAt
                      ? new Date(quote.issueDate || quote.createdAt).toLocaleDateString('en-IN')
                      : '—'}
                  </td>

                  {/* Sections */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center text-[11px] font-medium text-steel-700 bg-steel-100 px-2 py-0.5 rounded border border-steel-200">
                      {sectionCount} {sectionCount === 1 ? 'Floor/Zone' : 'Floors/Zones'}
                    </span>
                  </td>

                  {/* Total Area */}
                  <td className="py-3 px-3.5 whitespace-nowrap text-right font-mono font-medium text-steel-700">
                    {quoteSqft > 0 ? `${formatSqft(quoteSqft)} sqft` : '—'}
                  </td>

                  {/* Total Amount */}
                  <td className="py-3 px-3.5 whitespace-nowrap text-right font-mono font-bold text-steel-900">
                    {formatCurrency(quote.totalAmount)}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3.5 whitespace-nowrap text-center">
                    <StatusBadge status={quote.status} />
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3.5 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-1">
                      {(quote.status === 'DRAFT' || quote.status === 'SENT') && onEditQuotation && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditQuotation(quote);
                          }}
                          className="p-1 rounded text-steel-500 hover:text-edge-700 hover:bg-steel-100 transition-colors"
                          title="Edit Quotation"
                          aria-label={`Edit quotation ${quote.quoteNumber}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      {onPrintQuotation && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPrintQuotation(quote);
                          }}
                          className="p-1 rounded text-steel-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                          title="Print Quotation / PDF"
                          aria-label={`Print quotation ${quote.quoteNumber}`}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectQuotation(quote);
                        }}
                        className="p-1 rounded text-steel-500 hover:text-edge-700 hover:bg-steel-100 transition-colors"
                        title="Inspect Quotation"
                        aria-label={`Inspect quotation ${quote.quoteNumber}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuotationTable;
