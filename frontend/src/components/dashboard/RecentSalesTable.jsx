import React from 'react';
import { FileSpreadsheet, ExternalLink } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function RecentSalesTable({ quotations = [], onSelectQuote, onViewAll }) {
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
          <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-5 py-2.5 font-semibold">Quote #</th>
              <th className="px-5 py-2.5 font-semibold">Client</th>
              <th className="px-5 py-2.5 font-semibold">Status</th>
              <th className="px-5 py-2.5 font-semibold text-right">Amount</th>
              <th className="px-5 py-2.5 font-semibold text-right">Date</th>
              <th className="px-5 py-2.5 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {quotations.map((quote) => (
              <tr key={quote.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-3 font-mono font-semibold text-cyan-400">
                  {quote.quotationNumber}
                </td>
                <td className="px-5 py-3 text-slate-200">
                  <div className="font-medium truncate max-w-[150px]">{quote.customerName}</div>
                  <div className="text-[10px] text-slate-500">{quote.customerType}</div>
                </td>
                <td className="px-5 py-3">{getStatusBadge(quote.status)}</td>
                <td className="px-5 py-3 font-semibold text-right text-slate-100">
                  {formatCurrency(quote.totalAmount)}
                </td>
                <td className="px-5 py-3 text-right text-slate-400">
                  {formatDate(quote.createdAt)}
                </td>
                <td className="px-5 py-3 text-center">
                  <button
                    onClick={() => onSelectQuote?.(quote)}
                    className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    title="View Quote Details"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {quotations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-slate-500">
                  No recent quotations recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
