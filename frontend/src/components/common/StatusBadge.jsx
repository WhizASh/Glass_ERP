import React from 'react';

const statusConfig = {
  // Quotation Statuses
  DRAFT: { label: 'Draft', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
  SENT: { label: 'Sent', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  ACCEPTED: { label: 'Accepted', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-rose-50 text-rose-700 border-rose-200' },

  // Sale Order Statuses
  PENDING: { label: 'Pending', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  IN_PRODUCTION: { label: 'In Production', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  READY: { label: 'Ready for Dispatch', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
  DELIVERED: { label: 'Delivered', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },

  // Payment Statuses
  UNPAID: { label: 'Unpaid', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  PARTIAL: { label: 'Partial', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  PAID: { label: 'Paid', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
};

const StatusBadge = ({ status }) => {
  const normalized = (status || '').toUpperCase();
  const config = statusConfig[normalized] || {
    label: status || 'Unknown',
    bg: 'bg-slate-50 text-slate-600 border-slate-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
