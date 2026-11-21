import { Eye, Printer, Pencil, Plus } from 'lucide-react';
import DataTable from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';
import { primary, rowAction } from '../common/ui';
import { formatCurrency, formatSqft, getItemDisplayMetrics } from '../../lib/glassCalculations';

function glazingArea(quote) {
  const sqft = (quote.sections || []).reduce((total, section) => {
    const items = Array.isArray(section.items) ? section.items : section.items?.create || [];
    return total + items.reduce((area, item) => area + getItemDisplayMetrics(item).totalSqft, 0);
  }, 0);
  return sqft > 0 ? quote.measurementUnit === 'SQ_METER' ? `${(sqft * 0.092903).toFixed(3)} m²` : `${formatSqft(sqft)} sqft` : '—';
}

export default function QuotationTable({ quotations = [], loading, onSelectQuotation, onPrintQuotation, onEditQuotation, selectedQuotationId, onOpenCreateModal }) {
  const columns = [
    { header: 'Quotation', render: quote => <button type="button" onClick={event => { event.stopPropagation(); onSelectQuotation(quote); }} className={rowAction}>{quote.quoteNumber}</button> },
    { header: 'Customer', render: quote => <div className="max-w-xs break-words"><strong className="font-semibold">{quote.customer?.companyName || quote.customer?.name || '—'}</strong>{quote.customer?.companyName && <span className="mt-1 block text-xs text-steel-600">{quote.customer.name}{quote.customer.city ? ` · ${quote.customer.city}` : ''}</span>}</div> },
    { header: 'Date', render: quote => quote.issueDate || quote.createdAt ? new Date(quote.issueDate || quote.createdAt).toLocaleDateString('en-IN') : '—' },
    { header: 'Sections', render: quote => quote.sections?.length || 0 },
    { header: 'Glazing area', align: 'right', render: glazingArea },
    { header: 'Total amount', align: 'right', render: quote => <strong className="whitespace-nowrap font-semibold">{formatCurrency(quote.totalAmount)}</strong> },
    { header: 'Status', render: quote => <StatusBadge status={quote.status} /> },
    { header: 'Actions', render: quote => <div className="flex flex-wrap gap-1" onClick={event => event.stopPropagation()}>
      {['DRAFT', 'SENT'].includes(quote.status) && onEditQuotation && <button type="button" onClick={() => onEditQuotation(quote)} className={rowAction} aria-label={`Edit quotation ${quote.quoteNumber}`}><Pencil className="h-4 w-4" aria-hidden="true" />Edit</button>}
      {onPrintQuotation && <button type="button" onClick={() => onPrintQuotation(quote)} className={rowAction} aria-label={`Print quotation ${quote.quoteNumber}`}><Printer className="h-4 w-4" aria-hidden="true" />Print</button>}
      <button type="button" onClick={() => onSelectQuotation(quote)} className={rowAction} aria-label={`Inspect quotation ${quote.quoteNumber}`}><Eye className="h-4 w-4" aria-hidden="true" />Inspect</button>
    </div> }
  ];
  return <DataTable columns={columns} data={quotations} loading={loading} onRowClick={onSelectQuotation} selectedRowId={selectedQuotationId} tableAriaLabel="Quotations list" emptyMessage="No quotations found" emptySubtext="Try another search or create a quotation to start an estimate." actionButton={<button type="button" onClick={onOpenCreateModal} className={primary}><Plus className="h-4 w-4" aria-hidden="true" />New quotation</button>} />;
}
