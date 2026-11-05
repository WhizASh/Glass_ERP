import React from 'react';

/**
 * Container card with header title, description, actions slot, and children body.
 */
export default function Card({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = '',
  icon: Icon,
}) {
  return (
    <div className={`bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs ${className}`}>
      {(title || action || Icon) && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-sky-50 border border-sky-100 text-sky-600">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              {title && <h3 className="font-semibold text-base text-slate-800 tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
