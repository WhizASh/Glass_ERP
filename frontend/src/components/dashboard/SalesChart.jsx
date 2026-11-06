import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import Card from '../common/Card';
import { formatCurrency } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-lg text-xs">
        <p className="font-semibold text-slate-800 mb-1">{label}</p>
        <p className="text-sky-600 font-medium">
          Revenue: {formatCurrency(payload[0].value)}
        </p>
        {payload[1] && (
          <p className="text-emerald-600 font-medium">
            Volume: {payload[1].value} m²
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function SalesChart({ fetchSalesChart }) {
  const [period, setPeriod] = useState('month');
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    fetchSalesChart(period).then((data) => {
      if (mounted) {
        const normalized = (data || []).map((item) => {
          let label = item.label;
          if (!label && item.date) {
            try {
              const d = new Date(item.date);
              label = !isNaN(d.getTime())
                ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : item.date;
            } catch {
              label = item.date;
            }
          }
          const volumeM2 =
            item.volumeM2 ??
            item.totalAreaSqM ??
            (item.revenue ? Math.round(Number(item.revenue) / 65) : 0);

          return {
            ...item,
            label: label || item.date || '',
            volumeM2: Number(volumeM2) || 0,
          };
        });
        setChartData(normalized);
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [period, fetchSalesChart]);

  return (
    <Card
      title="Sales & Processing Trend"
      subtitle="Total turnover and fabricated square meters output"
      icon={TrendingUp}
      action={
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          {['week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md capitalize font-medium transition-all ${
                period === p
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      }
    >
      <div className="h-72 w-full pt-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            Loading sales trends...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            No chart data available for this timeframe
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#0284c7"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="volumeM2"
                name="Volume (m²)"
                stroke="#10b981"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorVolume)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
