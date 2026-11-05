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
    const matchesSearch =
      c.name.toLowerCase().includes(term) ||
      (c.companyName && c.companyName.toLowerCase().includes(term)) ||
      c.phone.toLowerCase().includes(term) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.gstin && c.gstin.toLowerCase().includes(term));

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
              className="glass-card p-5 border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${
                        isOrg
                          ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/50'
                          : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                      }`}
                    >
                      {isOrg ? <Building className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-100 text-sm">
                        {isOrg ? cust.companyName : cust.name}
                      </h4>
                      {isOrg && <p className="text-xs text-slate-400">Rep: {cust.name}</p>}
                    </div>
                  </div>
                  <Badge variant={isOrg ? 'primary' : 'success'} size="sm">
                    {cust.type}
                  </Badge>
                </div>

                {cust.gstin && (
                  <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800/80 mb-3">
                    Tax ID / GSTIN: <span className="text-cyan-300">{cust.gstin}</span>
                  </div>
                )}

                <div className="space-y-1.5 text-xs text-slate-300 mt-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{cust.phone}</span>
                  </div>
                  {cust.email && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{cust.email}</span>
                    </div>
                  )}
                  {cust.billingAddress && (
                    <div className="flex items-start gap-2 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{cust.billingAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">
            No customer accounts found matching current query.
          </div>
        )}
      </div>
    </div>
  );
}
