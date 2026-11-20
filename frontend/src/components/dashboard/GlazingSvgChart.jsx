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
  const colWidth = chartW / Math.max(data.length, 1);
  const points = data.map((d, idx) => ({
    x: padL + (idx + 0.5) * colWidth,
    totalY: padT + chartH * (1 - (metric === 'area' ? d.glazingArea : d.quotationValue / 1000) / roundedMax),
    acceptedY: padT + chartH * (1 - (metric === 'area' ? d.acceptedArea : d.acceptedValue / 1000) / roundedMax),
  }));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-52 select-none" role="group" aria-label={`${metric === 'area' ? 'Glazing area' : 'Pipeline value'} line chart: quoted and accepted trends`}>
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

        {/* Separate trend lines share the same scale and monthly positions. */}
        <polyline points={points.map((p) => `${p.x},${p.totalY}`).join(' ')} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={points.map((p) => `${p.x},${p.acceptedY}`).join(' ')} fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="6 4" strokeLinejoin="round" strokeLinecap="round" />

        {data.map((d, idx) => {
          const { x: cx, totalY, acceptedY } = points[idx];
          const isHovered = hoveredIdx === idx;

          return (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onFocus={() => setHoveredIdx(idx)}
              onBlur={() => setHoveredIdx(null)}
              tabIndex={0}
              role="img"
              aria-label={`${d.period}: quoted ${metric === 'area' ? `${d.glazingArea} square metres` : `${d.quotationValue} rupees`}, accepted ${metric === 'area' ? `${d.acceptedArea} square metres` : `${d.acceptedValue} rupees`}`}
              className="cursor-pointer focus:outline-none"
            >
              {isHovered && (
                <rect x={cx - colWidth / 2} y={padT} width={colWidth} height={chartH} fill="#0d9488" fillOpacity="0.06" rx="4" />
              )}
              <rect x={cx - colWidth / 2} y={padT} width={colWidth} height={chartH} fill="transparent" />
              <circle cx={cx} cy={totalY} r={isHovered ? 5 : 3.5} fill="#0d9488" stroke="white" strokeWidth="1.5" />
              <circle cx={cx} cy={acceptedY} r={isHovered ? 5 : 3.5} fill="#10b981" stroke="white" strokeWidth="1.5" />
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
        <div className="absolute top-2 right-2 sm:right-4 bg-slate-900 text-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md shadow-lg border border-slate-700 text-[10px] sm:text-xs font-mono z-10 pointer-events-none max-w-[200px] sm:max-w-xs">
          <p className="font-bold text-teal-400">{data[hoveredIdx].period} Glazing Summary</p>
          <div className="mt-1 space-y-0.5 text-[10px] sm:text-[11px] text-slate-200">
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
