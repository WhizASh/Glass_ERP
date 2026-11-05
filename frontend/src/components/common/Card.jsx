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
    <div className={`glass-card border border-slate-800 bg-slate-900/75 p-5 shadow-xl ${className}`}>
      {(title || action || Icon) && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              {title && <h3 className="font-semibold text-base text-slate-100 tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
