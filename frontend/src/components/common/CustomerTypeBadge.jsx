import React from 'react';
import { User, Building2 } from 'lucide-react';

const CustomerTypeBadge = ({ type }) => {
  const isOrg = (type || '').toUpperCase() === 'ORGANIZATION';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${
        isOrg
          ? 'bg-steel-100 text-steel-800 border-steel-200'
          : 'bg-edge-50 text-edge-800 border-edge-200'
      }`}
    >
      {isOrg ? (
        <>
          <Building2 className="w-3 h-3 text-steel-600" />
          <span>Organization / Firm</span>
        </>
      ) : (
        <>
          <User className="w-3 h-3 text-edge-700" />
          <span>Individual Contractor</span>
        </>
      )}
    </span>
  );
};

export default CustomerTypeBadge;
