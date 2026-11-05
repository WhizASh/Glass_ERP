import React from 'react';
import { Layers } from 'lucide-react';
import Card from '../common/Card';

export default function TopProduceWidget({ topProduce = [] }) {
  return (
    <Card
      title="Top Fabricated Profiles"
      subtitle="Ranked by total square meters processed"
      icon={Layers}
    >
      <div className="space-y-4 pt-1">
        {topProduce.map((item, index) => (
          <div key={index} className="group">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                  {item.name}
                </span>
                <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                  {item.category}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-100">{item.areaM2} m²</span>
                <span className="text-slate-400 text-[11px] ml-1.5">
                  ({item.ordersCount} runs)
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-sky-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, item.percentage || 20)}%` }}
              />
            </div>
          </div>
        ))}

        {topProduce.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-500">
            No glass production runs logged yet.
          </div>
        )}
      </div>
    </Card>
  );
}
