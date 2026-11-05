import React from 'react';
import { MapPin } from 'lucide-react';

export default function RackLocationBadge({ location }) {
  if (!location) {
    return <span className="text-slate-500 text-xs italic">Unassigned</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-800 text-cyan-300 border border-slate-700/80 px-2 py-0.5 rounded-md">
      <MapPin className="w-3 h-3 text-cyan-400" />
      {location}
    </span>
  );
}
