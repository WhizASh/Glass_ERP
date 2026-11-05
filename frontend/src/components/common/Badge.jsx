import React from 'react';

/**
 * Visual badge for statuses, categories, or metrics.
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) {
  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-sky-50 text-sky-700 border-sky-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const dotClasses = {
    default: 'bg-slate-500',
    primary: 'bg-sky-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-blue-500',
    purple: 'bg-purple-500',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.default
      } ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotClasses[variant] || dotClasses.default} animate-pulse`}
        />
      )}
      {children}
    </span>
  );
}
