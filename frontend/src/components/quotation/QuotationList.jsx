import React, { useState } from 'react';
import { Search, Eye, Pencil, Trash2, CheckCircle, CheckCheck, Send } from 'lucide-react';
import Badge from '../common/Badge';
import Input from '../common/Input';
import Select from '../common/Select';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function QuotationList({
  quotations = [],
  onSelectQuote,
  onUpdateStatus,
  onEditQuote,
  onDeleteQuote,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredQuotes = quotations.filter((q) => {
    const custName = q.customerName || q.customer?.name || q.customer?.companyName || '';
    const quoteNum = q.quotationNumber || '';
    const notesText = q.notes || '';
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      quoteNum.toLowerCase().includes(term) ||
      custName.toLowerCase().includes(term) ||
      notesText.toLowerCase().includes(term);

    const matchesStatus = !statusFilter || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success" dot size="sm">Completed</Badge>;
      case 'CONFIRMED':
        return <Badge variant="primary" dot size="sm">Confirmed</Badge>;
      case 'ISSUED':
        return <Badge variant="info" dot size="sm">Issued</Badge>;
      case 'DRAFT':
        return <Badge variant="warning" dot size="sm">Draft</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger" size="sm">Cancelled</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const statusOptions = [
    { value: '', label: 'All Quotations' },
    { value: 'DRAFT', label: 'Draft Estimates' },
    { value: 'ISSUED', label: 'Issued to Clients' },
    { value: 'CONFIRMED', label: 'Confirmed in Production' },
    { value: 'COMPLETED', label: 'Completed Deliveries' },
  ];

  return (
    <div className="space-y-4">
      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80">
          <Input
            icon={Search}
            placeholder="Search Quote#, client or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-64">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 font-semibold">Quote ID</th>
                <th className="px-5 py-3 font-semibold">Client Name</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Items</th>
                <th className="px-5 py-3 font-semibold text-right">Grand Total</th>
                <th className="px-5 py-3 font-semibold text-right">Date</th>
                <th className="px-5 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotes.map((q) => {
                const clientName = q.customerName || q.customer?.companyName || q.customer?.name || 'Direct Client';
                const clientType = q.customerType || q.customer?.type || 'INDIVIDUAL';
                return (
                  <tr
                    key={q.id}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    onClick={() => onSelectQuote(q)}
                  >
                    <td className="px-5 py-3.5 font-mono font-semibold text-sky-600">
                      {q.quotationNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{clientName}</div>
                      {q.notes && (
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{q.notes}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {clientType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">{getStatusBadge(q.status)}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-600">
                      {q.items?.length || 0} pane(s)
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatCurrency(q.totalAmount)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-500">{formatDate(q.createdAt)}</td>
                    <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectQuote(q)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                          title="View Full Spec & Invoice"
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-600" />
                        </button>
                        {(q.status === 'DRAFT' || q.status === 'ISSUED') && onEditQuote && (
                          <button
                            type="button"
                            onClick={() => onEditQuote(q)}
                            className="p-1 rounded bg-slate-100 hover:bg-amber-50 text-amber-600"
                            title="Edit Specifications"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {q.status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(q.id, 'ISSUED')}
                            className="p-1 rounded bg-slate-100 hover:bg-blue-50 text-blue-600"
                            title="Issue to Client"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {q.status === 'ISSUED' && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(q.id, 'CONFIRMED')}
                            className="p-1 rounded bg-slate-100 hover:bg-emerald-50 text-emerald-600"
                            title="Confirm into Production"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {q.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(q.id, 'COMPLETED')}
                            className="p-1 rounded bg-slate-100 hover:bg-sky-50 text-sky-600"
                            title="Mark Completed"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteQuote && (q.status === 'DRAFT' || q.status === 'ISSUED' || q.status === 'CANCELLED') && (
                          <button
                            type="button"
                            onClick={() => onDeleteQuote(q.id)}
                            className="p-1 rounded bg-slate-100 hover:bg-rose-50 text-rose-500 hover:text-rose-600"
                            title="Delete Quotation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredQuotes.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400 text-sm">
                    No quotations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
