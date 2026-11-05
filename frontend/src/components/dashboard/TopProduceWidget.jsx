import React from 'react';
import { Layers } from 'lucide-react';
import Card from '../common/Card';

export default function TopProduceWidget({ topProduce = [] }) {
  // Normalize topProduce: guard against null, undefined, or { success: true, data: [...] }
  const items = Array.isArray(topProduce)
    ? topProduce
    : Array.isArray(topProduce?.data)
    ? topProduce.data
    : [];

  const maxArea = items.reduce(
    (max, i) => Math.max(max, Number(i.areaM2 ?? i.totalAreaSqM ?? 0)),
    0
  );

  return (
    <Card
      title="Top Fabricated Profiles"
      subtitle="Ranked by total square meters processed"
      icon={Layers}
    >
      <div className="space-y-4 pt-1">
        {items.map((item, index) => {
          const name =
            item.name ||
            item.label ||
            `${item.thicknessMm ? `${item.thicknessMm}mm ` : ''}${item.glassType || 'Glass'}`;
          const category = item.category || 'Fabricated Glass';
          const area = Number(item.areaM2 ?? item.totalAreaSqM ?? 0).toFixed(1);
          const orders = item.ordersCount ?? item.orderCount ?? 0;
          const percentage =
            item.percentage ??
            (maxArea > 0
              ? Math.min(100, Math.round(((Number(item.areaM2 ?? item.totalAreaSqM ?? 0)) / maxArea) * 100))
              : 25);

          return (
            <div key={index} className="group">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 group-hover:text-sky-600 transition-colors">
                    {name}
                  </span>
                  <span className="text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                    {category}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800">{area} m²</span>
                  <span className="text-slate-500 text-[11px] ml-1.5">
                    ({orders} {orders === 1 ? 'run' : 'runs'})
                  </span>
                </div>
              </div>
              {/* Light theme progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/80">
                <div
                  className="bg-gradient-to-r from-sky-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(8, percentage)}%` }}
                />
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400">
            No glass production runs logged yet.
          </div>
        )}
      </div>
    </Card>
  );
}
