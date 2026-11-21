import React from 'react';

/**
 * Reusable table skeleton loader matching the architectural quotations design.
 * Provides accessible pulsing placeholders while asynchronous data is fetched.
 */
const TableSkeleton = ({
  ariaLabel = 'Loading data',
  rows = 4
}) => {
  return (
    <div
      className="bg-white rounded-lg border border-steel-200 p-4 sm:p-6 space-y-3"
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <div className="h-5 bg-steel-100 rounded w-1/4 animate-pulse motion-reduce:animate-none" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-12 bg-steel-50 rounded border border-steel-100 animate-pulse motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  );
};

export default TableSkeleton;
