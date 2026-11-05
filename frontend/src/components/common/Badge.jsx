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
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    primary: 'bg-cyan-950/70 text-cyan-400 border-cyan-800/60',
    success: 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60',
    warning: 'bg-amber-950/70 text-amber-400 border-amber-800/60',
    danger: 'bg-rose-950/70 text-rose-400 border-rose-800/60',
    info: 'bg-blue-950/70 text-blue-400 border-blue-800/60',
    purple: 'bg-purple-950/70 text-purple-400 border-purple-800/60',
  };

  const dotClasses = {
    default: 'bg-slate-400',
    primary: 'bg-cyan-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-blue-400',
    purple: 'bg-purple-400',
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
