import React from 'react';
import { User, Building } from 'lucide-react';

const CustomerTypeBadge = ({ type }) => {
  const isOrg = (type || '').toUpperCase() === 'ORGANIZATION';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${
        isOrg
          ? 'bg-blue-50 text-blue-700 border-blue-200/80'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
      }`}
    >
      {isOrg ? (
        <>
          <Building className="w-3 h-3 text-blue-500" />
          <span>Organization</span>
        </>
      ) : (
        <>
          <User className="w-3 h-3 text-emerald-500" />
          <span>Individual</span>
        </>
      )}
    </span>
  );
};

export default CustomerTypeBadge;
