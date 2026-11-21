import { FilterTabs } from '../common/PageLayout';
import { input } from '../common/ui';

const STATUS_OPTIONS = ['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'CANCELLED'].map(value => ({ value, label: value === 'ALL' ? 'All quotations' : value.charAt(0) + value.slice(1).toLowerCase() }));

export default function QuotationFilterBar({ searchQuery, onSearchChange, selectedStatus, onStatusChange, statusCounts }) {
  return <div className="space-y-4">
    <label className="block text-sm font-medium text-steel-700 sm:max-w-sm">Search quotations
      <input type="search" placeholder="Quotation number, customer or company" value={searchQuery} onChange={event => onSearchChange(event.target.value)} className={`${input} mt-1`} />
    </label>
    <FilterTabs label="Quotation status" value={selectedStatus} onChange={onStatusChange} options={STATUS_OPTIONS} counts={statusCounts} />
  </div>;
}
