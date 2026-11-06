import React from 'react';

const statusConfig = {
  // Quotation Statuses
  DRAFT: { label: 'Draft', bg: 'bg-steel-100 text-steel-700 border-steel-200 dot-bg-steel-400' },
  SENT: { label: 'Sent / In Review', bg: 'bg-sky-50 text-sky-800 border-sky-200 dot-bg-sky-500' },
  ACCEPTED: { label: 'Accepted', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 dot-bg-emerald-600' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-rose-50 text-rose-800 border-rose-200 dot-bg-rose-500' },

  // Sale Order Statuses
  PENDING: { label: 'Pending Production', bg: 'bg-amber-50 text-amber-800 border-amber-200 dot-bg-amber-500' },
  IN_PRODUCTION: { label: 'In Processing', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200 dot-bg-indigo-600' },
  READY: { label: 'Ready for Dispatch', bg: 'bg-teal-50 text-teal-800 border-teal-200 dot-bg-teal-600' },
  DELIVERED: { label: 'Delivered', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 dot-bg-emerald-600' },

  // Payment Statuses
  UNPAID: { label: 'Unpaid', bg: 'bg-rose-50 text-rose-800 border-rose-200 dot-bg-rose-500' },
  PARTIAL: { label: 'Partial', bg: 'bg-amber-50 text-amber-800 border-amber-200 dot-bg-amber-500' },
  PAID: { label: 'Paid in Full', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 dot-bg-emerald-600' }
};

const StatusBadge = ({ status }) => {
  const normalized = (status || '').toUpperCase();
  const config = statusConfig[normalized] || {
    label: status || 'Unknown',
    bg: 'bg-steel-50 text-steel-700 border-steel-200'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${config.bg}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
