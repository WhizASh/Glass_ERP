import React from 'react';

const StatCard = ({ title, value, icon: Icon, description, trendColor = 'blue' }) => {
  return (
    <div className="glass-card rounded-2xl p-5 hover:border-blue-200 transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-800 tracking-tight">
          {value ?? 0}
        </p>
        {description && (
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
