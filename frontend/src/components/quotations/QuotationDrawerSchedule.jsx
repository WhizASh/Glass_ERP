import React from 'react';

const QuotationDrawerSchedule = ({ sections = [] }) => {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-steel-900 uppercase tracking-wider text-[11px]">
        Architectural Glass Specifications & Schedule
      </h3>

      {sections.map((section, sIdx) => (
        <div key={section.id || sIdx} className="border border-steel-200 rounded-lg overflow-hidden">
          <div className="bg-steel-100 px-3 py-1.5 font-bold text-steel-800 text-[11px] border-b border-steel-200 flex justify-between">
            <span>{section.sectionName}</span>
            <span className="font-mono text-steel-500">{section.items?.length || 0} line items</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-steel-50 text-[10px] uppercase text-steel-500 border-b border-steel-200">
              <tr>
                <th className="py-1.5 px-2.5">Glass Item</th>
                <th className="py-1.5 px-2 text-right">W × H (mm)</th>
                <th className="py-1.5 px-2 text-right">Area</th>
                <th className="py-1.5 px-2 text-center">Qty</th>
                <th className="py-1.5 px-2 text-right">Rate (₹)</th>
                <th className="py-1.5 px-2.5 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100 font-mono">
              {(section.items || []).map((item, iIdx) => (
                <tr key={item.id || iIdx} className="hover:bg-steel-50">
                  <td className="py-2 px-2.5 font-sans font-medium text-steel-800">
                    {item.productSku?.name || item.description || 'Glass Spec'}
                  </td>
                  <td className="py-2 px-2 text-right text-steel-600">
                    {item.widthMm && item.heightMm ? `${Number(item.widthMm)}×${Number(item.heightMm)}` : '—'}
                  </td>
                  <td className="py-2 px-2 text-right text-steel-600">
                    {item.areaSqM ? `${Number(item.areaSqM).toFixed(2)} m²` : '—'}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-steel-900">{Number(item.quantity)}</td>
                  <td className="py-2 px-2 text-right text-steel-700">₹{Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-2 px-2.5 text-right font-bold text-steel-900">₹{Number(item.totalPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default QuotationDrawerSchedule;
