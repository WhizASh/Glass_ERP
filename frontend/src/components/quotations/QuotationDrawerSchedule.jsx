import React from 'react';
import { formatSqft, formatCurrency, getItemDisplayMetrics } from '../../lib/glassCalculations';

const QuotationDrawerSchedule = ({ sections = [] }) => {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-steel-900 uppercase tracking-wider text-[11px] flex items-center justify-between">
        <span>Architectural Glass Specifications &amp; Takeoff Schedule</span>
        <span className="text-[10px] text-steel-500 font-normal font-mono">
          Commercial 6" Grid Rounding
        </span>
      </h3>

      {sections.map((section, sIdx) => {
        const items = Array.isArray(section.items) ? section.items : (section.items?.create || []);

        return (
          <div key={section.id || sIdx} className="border border-steel-200 rounded-lg overflow-hidden bg-white shadow-2xs">
            <div className="bg-steel-100 px-3.5 py-2 font-bold text-steel-800 text-xs border-b border-steel-200 flex justify-between items-center">
              <span className="flex items-center gap-2">
                <span className="font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-[10px] font-bold">
                  SEC-{sIdx + 1}
                </span>
                <span className="text-steel-900 font-bold">{section.sectionName || `Section ${sIdx + 1}`}</span>
              </span>
              <span className="font-mono text-steel-500 text-[11px]">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[560px]">
                <thead className="bg-steel-50 text-[10px] uppercase font-bold text-steel-600 border-b border-steel-200">
                  <tr>
                    <th className="py-2 px-3 text-left">Glass Specification</th>
                    <th className="py-2 px-2 text-center w-24">Cut Size</th>
                    <th className="py-2 px-2 text-center w-28 text-teal-800">Billing Size</th>
                    <th className="py-2 px-2 text-right w-24">Glazing Area</th>
                    <th className="py-2 px-2 text-center w-14">Qty</th>
                    <th className="py-2 px-2 text-right w-24">Rate (₹/sqft)</th>
                    <th className="py-2 px-3 text-right w-28">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-100 font-mono text-[11px]">
                  {items.map((item, iIdx) => {
                    const metrics = getItemDisplayMetrics(item);

                    return (
                      <tr key={item.id || iIdx} className="hover:bg-steel-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-sans font-medium text-steel-900">
                          <div>
                            <span>{item.productSku?.name || item.description || 'Glass Specification'}</span>
                            {item.productSku?.thicknessMm && (
                              <span className="text-steel-500 text-[10px] block font-mono">
                                {Number(item.productSku.thicknessMm)}mm {item.productSku.glassType}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="font-mono text-steel-800 font-semibold bg-steel-100 px-2 py-0.5 rounded border border-steel-200 inline-block whitespace-nowrap">
                            {metrics.cutSize}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="font-mono text-teal-900 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-bold inline-block whitespace-nowrap shadow-2xs">
                            {metrics.billingSize}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right text-steel-900">
                          <div className="font-bold">{formatSqft(metrics.totalSqft)} sqft</div>
                          {metrics.qty > 1 && (
                            <div className="text-[10px] text-steel-400 font-normal">
                              ({formatSqft(metrics.sqft)}/pc)
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-steel-900">
                          {metrics.qty}
                        </td>
                        <td className="py-2.5 px-2 text-right text-steel-700">
                          ₹{metrics.rate.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-teal-800">
                          {formatCurrency(metrics.lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuotationDrawerSchedule;
