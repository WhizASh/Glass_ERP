import React from 'react';
import { MapPin } from 'lucide-react';

export default function RackLocationBadge({ location }) {
  if (!location) {
    return <span className="text-slate-400 text-xs italic">Unassigned</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-medium">
      <MapPin className="w-3 h-3 text-sky-600" />
      {location}
    </span>
  );
}
