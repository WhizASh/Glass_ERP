import React from 'react';
import { FileSpreadsheet, ExternalLink } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function RecentSalesTable({ quotations = [], onSelectQuote, onViewAll }) {
  const quotes = Array.isArray(quotations)
    ? quotations
    : Array.isArray(quotations?.data)
    ? quotations.data
    : [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success" dot size="sm">Completed</Badge>;
      case 'CONFIRMED':
        return <Badge variant="primary" dot size="sm">Confirmed</Badge>;
      case 'DRAFT':
        return <Badge variant="warning" dot size="sm">Draft</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger" size="sm">Cancelled</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <Card
      title="Recent Quotations & Orders"
      subtitle="Latest commercial and retail glass estimates"
      icon={FileSpreadsheet}
      action={
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          View All
        </Button>
      }
    >
      <div className="overflow-x-auto -mx-5 -mb-5">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-5 py-2.5 font-semibold">Quote #</th>
              <th className="px-5 py-2.5 font-semibold">Client</th>
              <th className="px-5 py-2.5 font-semibold">Status</th>
              <th className="px-5 py-2.5 font-semibold text-right">Amount</th>
              <th className="px-5 py-2.5 font-semibold text-right">Date</th>
              <th className="px-5 py-2.5 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quotes.map((quote) => {
              const clientName =
                quote.customerName ||
                quote.customer?.companyName ||
                quote.customer?.name ||
                'Client';
              const clientType =
                quote.customerType || quote.customer?.type || 'INDIVIDUAL';

              return (
                <tr key={quote.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3 font-mono font-bold text-sky-600">
                    {quote.quotationNumber}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    <div className="font-semibold text-slate-900 truncate max-w-[150px]">{clientName}</div>
                    <div className="text-[10px] text-slate-400">{clientType}</div>
                  </td>
                  <td className="px-5 py-3">{getStatusBadge(quote.status)}</td>
                  <td className="px-5 py-3 font-semibold text-right text-slate-900 font-mono">
                    {formatCurrency(quote.totalAmount)}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-500">
                    {formatDate(quote.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectQuote?.(quote)}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                      title="View Quote Specification"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {quotes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                  No quotations created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
