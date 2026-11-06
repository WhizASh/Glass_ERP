import React, { useState } from 'react';
import { Search, Building, User, Mail, Phone, MapPin } from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import Badge from '../common/Badge';

export default function CustomerList({ customers = [], onSelectCustomer }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    const nameStr = c.name || '';
    const compStr = c.companyName || '';
    const phoneStr = c.phone || '';
    const emailStr = c.email || '';
    const gstinStr = c.gstin || '';

    const matchesSearch =
      nameStr.toLowerCase().includes(term) ||
      compStr.toLowerCase().includes(term) ||
      phoneStr.toLowerCase().includes(term) ||
      emailStr.toLowerCase().includes(term) ||
      gstinStr.toLowerCase().includes(term);

    const matchesType = !typeFilter || c.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const typeOptions = [
    { value: '', label: 'All Client Accounts' },
    { value: 'ORGANIZATION', label: 'Commercial Organizations' },
    { value: 'INDIVIDUAL', label: 'Individual Clients' },
  ];

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80">
          <Input
            icon={Search}
            placeholder="Search company, contact, or GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-64">
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={typeOptions}
          />
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const isOrg = cust.type === 'ORGANIZATION';
          return (
            <div
              key={cust.id}
              onClick={() => onSelectCustomer?.(cust)}
              className="glass-card p-5 border border-slate-200/90 bg-white hover:border-slate-300 shadow-xs transition-all flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${
                        isOrg
                          ? 'bg-sky-50 text-sky-600 border border-sky-100'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}
                    >
                      {isOrg ? <Building className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">
                        {isOrg ? cust.companyName : cust.name}
                      </h4>
                      {isOrg && <p className="text-xs text-slate-500">Rep: {cust.name}</p>}
                    </div>
                  </div>
                  <Badge variant={isOrg ? 'primary' : 'success'} size="sm">
                    {cust.type}
                  </Badge>
                </div>

                {cust.gstin && (
                  <div className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 mb-3">
                    Tax ID / GSTIN: <span className="text-sky-700 font-semibold">{cust.gstin}</span>
                  </div>
                )}

                <div className="space-y-1.5 text-xs text-slate-600 mt-2">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{cust.phone}</span>
                  </div>
                  {cust.email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{cust.email}</span>
                    </div>
                  )}
                  {cust.billingAddress && (
                    <div className="flex items-start gap-2 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{cust.billingAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">
            No customer accounts found matching current query.
          </div>
        )}
      </div>
    </div>
  );
}
