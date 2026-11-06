import React from 'react';

const StatCard = ({ title, value, icon: Icon, description }) => {
  return (
    <div className="bg-white rounded-lg border border-steel-200 p-4 shadow-xs hover:border-steel-300 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-steel-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-md bg-steel-100 text-steel-700 border border-steel-200">
            <Icon className="w-4 h-4 text-edge-700" />
          </div>
        )}
      </div>
      <div className="mt-2.5">
        <p className="text-2xl font-mono font-bold text-steel-900 tracking-tight">
          {value ?? 0}
        </p>
        {description && (
          <p className="text-[11px] text-steel-500 mt-0.5 font-medium">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
