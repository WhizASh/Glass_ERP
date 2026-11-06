import React, { useState } from 'react';

const GlazingSvgChart = ({ data = [], metric = 'area' }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const W = 720;
  const H = 200;
  const padL = 50;
  const padR = 20;
  const padT = 25;
  const padB = 35;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxVal = Math.max(
    ...data.map((d) => (metric === 'area' ? d.glazingArea : d.quotationValue / 1000)),
    10
  );
  const roundedMax = Math.ceil(maxVal * 1.15);
  const colWidth = chartW / data.length;
  const barW = Math.min(colWidth * 0.45, 36);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-52 select-none">
        {/* Horizontal Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padT + chartH * (1 - ratio);
          const label = metric === 'area'
            ? `${Math.round(roundedMax * ratio)} m²`
            : `₹${Math.round((roundedMax * ratio))}k`;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e2e8f0" strokeDasharray="2 3" strokeWidth="1" />
              <text x={padL - 8} y={y + 3.5} textAnchor="end" className="fill-steel-400 font-mono text-[10px]">
                {label}
              </text>
            </g>
          );
        })}

        {/* Column Bars & Hover Targets */}
        {data.map((d, idx) => {
          const totalVal = metric === 'area' ? d.glazingArea : d.quotationValue / 1000;
          const subVal = metric === 'area' ? d.acceptedArea : d.acceptedValue / 1000;
          const totalH = (totalVal / roundedMax) * chartH;
          const subH = (subVal / roundedMax) * chartH;
          const cx = padL + idx * colWidth + colWidth / 2;
          const x = cx - barW / 2;
          const isHovered = hoveredIdx === idx;

          return (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {isHovered && (
                <rect x={cx - colWidth / 2} y={padT} width={colWidth} height={chartH} fill="#0d9488" fillOpacity="0.06" rx="4" />
              )}
              {/* Quoted Total Bar (Teal Base) */}
              <rect
                x={x}
                y={padT + chartH - totalH}
                width={barW}
                height={totalH}
                rx="3"
                className="transition-all duration-200"
                fill={isHovered ? '#0f766e' : '#0d9488'}
              />
              {/* Accepted / Won Bar Overlay (Emerald Accent) */}
              <rect
                x={x + 2}
                y={padT + chartH - subH}
                width={barW - 4}
                height={subH}
                rx="2"
                fill="#10b981"
                className="transition-all duration-200"
              />
              {/* Month Label */}
              <text
                x={cx}
                y={H - 12}
                textAnchor="middle"
                className={`font-mono text-[11px] ${isHovered ? 'fill-steel-900 font-bold' : 'fill-steel-500 font-medium'}`}
              >
                {d.period}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Inspection Tooltip */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div className="absolute top-2 right-4 bg-slate-900 text-white px-3 py-2 rounded-md shadow-lg border border-slate-700 text-xs font-mono z-10 pointer-events-none">
          <p className="font-bold text-teal-400">{data[hoveredIdx].period} Glazing Summary</p>
          <div className="mt-1 space-y-0.5 text-[11px] text-slate-200">
            <p>Quoted: <span className="font-bold text-white">{data[hoveredIdx].glazingArea} m²</span> (₹{data[hoveredIdx].quotationValue?.toLocaleString('en-IN')})</p>
            <p>Accepted: <span className="font-bold text-emerald-400">{data[hoveredIdx].acceptedArea} m²</span></p>
            <p className="text-slate-400">{data[hoveredIdx].count} glass takeoff projects</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlazingSvgChart;
