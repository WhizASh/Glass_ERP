import React from 'react';
import { UserPlus } from 'lucide-react';
import { SaleField, SaleSection } from './saleUi';

export default function SaleOrderDetails({ form, setForm, customers, quotations, onQuotationChange, onAddCustomer, disabled }) {
  return (
    <SaleSection title="Order details" subtitle="Start a direct order or use an existing quotation.">
      <div className="grid gap-3 sm:grid-cols-2">
        <SaleField label="Quotation reference" hint={form.quotationId ? 'Customer and glass items come from this quotation.' : 'Optional. Leave blank for a direct sale.'}>
          <select name="quotationId" value={form.quotationId} disabled={disabled} onChange={event => onQuotationChange(event.target.value)}>
            <option value="">Direct order</option>
            {quotations.map(quote => <option key={quote.id} value={quote.id}>{quote.quoteNumber} · {quote.customer?.companyName || quote.customer?.name} [{quote.status}]</option>)}
          </select>
        </SaleField>
        <div className="min-w-0">
          <SaleField label="Customer *" hint={form.quotationId ? 'Linked to the selected quotation.' : undefined}>
            <select required name="customerId" disabled={disabled || Boolean(form.quotationId)} value={form.customerId} onChange={event => {
              const customer = customers.find(row => row.id === event.target.value);
              setForm(current => ({ ...current, customerId: event.target.value, deliveryAddress: current.deliveryAddress || customer?.address || '' }));
            }}>
              <option value="">Choose a customer</option>
              {customers.map(customer => <option key={customer.id} value={customer.id}>{customer.companyName ? `${customer.companyName} (${customer.name})` : customer.name}{customer.city ? ` · ${customer.city}` : ''}</option>)}
            </select>
          </SaleField>
          {!disabled && !form.quotationId && <button type="button" onClick={onAddCustomer} className="mt-1 inline-flex min-h-11 items-center gap-1.5 rounded text-xs font-medium text-teal-700 hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"><UserPlus className="h-3.5 w-3.5" aria-hidden="true" />Add a customer</button>}
        </div>
      </div>
    </SaleSection>
  );
}
