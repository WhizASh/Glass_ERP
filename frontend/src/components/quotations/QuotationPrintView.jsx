import React from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import QuotationSeal from '../common/QuotationSeal';
import {
  formatCurrency,
  formatSqft,
  numberToWordsIndian,
  getItemDisplayMetrics
} from '../../lib/glassCalculations';

const QuotationPrintView = ({ quotation, onClose }) => {
  if (!quotation) return null;

  const customer = quotation.customer || {};
  const sections = quotation.sections || [];

  // Compute total area in sqft using universal display metrics
  let totalSqft = 0;
  sections.forEach((sec) => {
    const secItems = Array.isArray(sec.items) ? sec.items : (sec.items?.create || []);
    secItems.forEach((item) => {
      const metrics = getItemDisplayMetrics(item);
      totalSqft += metrics.totalSqft;
    });
  });

  const subtotal = Number(quotation.subtotal) || 0;
  const discountAmount = Number(quotation.discountAmount) || 0;
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const taxRate = Number(quotation.taxRate) || 0;
  const taxAmount = Number(quotation.taxAmount) || 0;
  const grandTotal = Number(quotation.totalAmount) || 0;

  const issueDateFormatted = quotation.issueDate || quotation.createdAt
    ? new Date(quotation.issueDate || quotation.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-IN');

  const content = (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-steel-900/70 backdrop-blur-xs flex justify-center p-2 sm:p-4 print-dialog print-modal-overlay">
      {/* Screen Preview Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-2xl my-4 flex flex-col overflow-hidden print-preview-container">
        {/* On-screen toolbar (hidden when printing) */}
        <div className="no-print bg-[#0f172a] text-white px-5 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-edge-400" />
            <span className="text-xs font-semibold">
              Quotation Print &amp; PDF Preview — {quotation.quoteNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-md text-steel-400 hover:text-white hover:bg-steel-800 transition-colors"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Dedicated Printable Sheet (Replicates Spreadsheet Design) */}
        <div
          id="quotation-print-sheet"
          className="p-8 sm:p-10 bg-white text-slate-900 font-sans text-xs flex-1 flex flex-col justify-between"
        >
          <div>
            {/* Header Block: Company Details (Left) + Document Meta (Right) */}
            <div className="border-b-2 border-slate-800 pb-4 mb-4 flex justify-between items-start gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase font-serif">
                  SADAR GLASS &amp; ALLUMINIUM
                </h1>
                <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                  Architectural, Toughened, Laminated &amp; Insulated (DGU) Glass Fabricators &amp; Glazing Contractors
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Plot No. 14, Central Avenue Road, Near Agrasen Square, Gandhibagh, Nagpur - 440002 (M.S.)
                </p>
                <p className="text-[10px] text-slate-600">
                  Phone: +91 98222 54321 / +91 712 2765432 &nbsp;|&nbsp; Email: sadarglass@gmail.com
                </p>
                <p className="text-[10px] font-bold text-slate-800 mt-1">
                  GSTIN: <span className="font-mono">27AABCS9876Q1ZB</span>
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Official Quotation Seal */}
                <QuotationSeal status={quotation.status} size="lg" />

                {/* Quote Meta Card */}
                <div className="text-right border border-slate-300 rounded p-2.5 bg-slate-50 min-w-[190px]">
                  <div className="text-xs font-black tracking-wider text-slate-900 uppercase border-b border-slate-200 pb-1 mb-1.5">
                    QUOTATION / ESTIMATE
                  </div>
                  <div className="text-[11px] font-bold text-teal-800 font-mono">
                    Quote No: {quotation.quoteNumber}
                  </div>
                  <div className="text-[10px] text-slate-700 mt-1">
                    Date: <span className="font-mono font-bold text-slate-900">{issueDateFormatted}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Block */}
            <div className="border border-slate-300 rounded-md p-3 mb-3 bg-slate-50/70 flex justify-between items-start">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                  To : -
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {customer.companyName || customer.name}
                </div>
                {customer.companyName && customer.name && (
                  <div className="text-[11px] text-slate-700 font-medium">
                    Attn: {customer.name}
                  </div>
                )}
                {customer.address && (
                  <div className="text-[10px] text-slate-600">{customer.address}</div>
                )}
                {customer.city && (
                  <div className="text-[10px] font-semibold text-slate-700">{customer.city}</div>
                )}
              </div>

              <div className="text-right text-[10px] text-slate-700 space-y-0.5">
                {customer.phone && (
                  <div>
                    Mobile: <span className="font-mono font-semibold">{customer.phone}</span>
                  </div>
                )}
                {customer.email && <div>Email: {customer.email}</div>}
                {customer.taxId && (
                  <div>
                    GSTIN: <span className="font-mono font-bold uppercase">{customer.taxId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Introductory Declaration */}
            <div className="text-[11px] text-slate-700 mb-3 italic">
              Dear Sir/Madam,
              <br />
              We thank you for your valued enquiry. We take pleasure in submitting our lowest quotation for the supply and fabrication of Architectural Glass as per specifications and measurements detailed below:
            </div>

            {/* Schedule Table */}
            <div className="overflow-x-auto mb-4 border border-slate-800 rounded-none">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold uppercase text-[9px] tracking-wider border-b border-slate-800">
                    <th className="py-1.5 px-2 text-center w-10 border-r border-slate-700">S.No.</th>
                    <th className="py-1.5 px-2 border-r border-slate-700">Particulars / Glass Specification</th>
                    <th className="py-1.5 px-2 text-center w-20 border-r border-slate-700">Cut Size</th>
                    <th className="py-1.5 px-2 text-center w-20 border-r border-slate-700">Billing Size</th>
                    <th className="py-1.5 px-2 text-center w-12 border-r border-slate-700">Qty</th>
                    <th className="py-1.5 px-2 text-right w-16 border-r border-slate-700">Sq.ft</th>
                    <th className="py-1.5 px-2 text-right w-20 border-r border-slate-700">Rate (₹/sqft)</th>
                    <th className="py-1.5 px-2 text-right w-24">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {sections.map((sec, secIdx) => {
                    const sectionNumber = secIdx + 1;
                    const secItems = Array.isArray(sec.items) ? sec.items : (sec.items?.create || []);

                    return (
                      <React.Fragment key={sec.id || secIdx}>
                        {/* Section Header Row */}
                        <tr className="bg-slate-100 font-bold border-t border-b border-slate-400">
                          <td className="py-1 px-2 text-center font-mono border-r border-slate-300">
                            {sectionNumber}
                          </td>
                          <td colSpan={7} className="py-1 px-2 uppercase tracking-wide text-slate-900">
                            {sec.sectionName}
                          </td>
                        </tr>

                        {/* Section Items */}
                        {secItems.map((item, itemIdx) => {
                          const itemNumber = `${sectionNumber}.${itemIdx + 1}`;
                          const metrics = getItemDisplayMetrics(item);

                          return (
                            <tr key={item.id || itemIdx} className="hover:bg-slate-50">
                              <td className="py-1 px-2 text-center font-mono border-r border-slate-300 text-slate-600">
                                {itemNumber}
                              </td>
                              <td className="py-1 px-2 border-r border-slate-300 font-medium text-slate-900">
                                {item.productSku?.name || item.description || 'Glass Specification'}
                                {item.productSku?.thicknessMm && (
                                  <span className="text-slate-500 text-[9px] ml-1">
                                    ({Number(item.productSku.thicknessMm)}mm {item.productSku.glassType})
                                  </span>
                                )}
                              </td>
                              <td className="py-1 px-2 text-center font-mono border-r border-slate-300 text-slate-700 whitespace-nowrap font-medium">
                                {metrics.cutSize}
                              </td>
                              <td className="py-1 px-2 text-center font-mono border-r border-slate-300 text-teal-900 font-bold whitespace-nowrap bg-teal-50/50">
                                {metrics.billingSize}
                              </td>
                              <td className="py-1 px-2 text-center font-mono font-bold text-slate-900 border-r border-slate-300">
                                {metrics.qty}
                              </td>
                              <td className="py-1 px-2 text-right font-mono border-r border-slate-300 text-slate-800 font-semibold">
                                {formatSqft(metrics.totalSqft)}
                              </td>
                              <td className="py-1 px-2 text-right font-mono border-r border-slate-300 text-slate-700">
                                ₹{metrics.rate.toFixed(2)}
                              </td>
                              <td className="py-1 px-2 text-right font-mono font-bold text-slate-900">
                                ₹{metrics.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Commercial Breakdown & Totals Block */}
            <div className="flex justify-end mb-4">
              <div className="w-full sm:w-80 border border-slate-400 rounded-none bg-slate-50/50">
                <table className="w-full text-[10px] font-mono border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-1 px-2.5 text-slate-600 font-sans">Total Glazing Area:</td>
                      <td className="py-1 px-2.5 text-right font-bold text-slate-900">
                        {formatSqft(totalSqft)} sq.ft
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1 px-2.5 text-slate-600 font-sans">Fabrication Subtotal:</td>
                      <td className="py-1 px-2.5 text-right font-semibold text-slate-800">
                        {formatCurrency(subtotal)}
                      </td>
                    </tr>
                    {discountAmount > 0 && (
                      <tr className="border-b border-slate-200 text-emerald-800">
                        <td className="py-1 px-2.5 font-sans">
                          Discount {quotation.discountType === 'PERCENTAGE' ? `(${quotation.discountValue}%)` : '(Fixed)'}:
                        </td>
                        <td className="py-1 px-2.5 text-right font-semibold">
                          -{formatCurrency(discountAmount)}
                        </td>
                      </tr>
                    )}
                    {discountAmount > 0 && (
                      <tr className="border-b border-slate-200">
                        <td className="py-1 px-2.5 text-slate-600 font-sans">Taxable Value:</td>
                        <td className="py-1 px-2.5 text-right font-semibold text-slate-800">
                          {formatCurrency(taxableSubtotal)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-b border-slate-200">
                      <td className="py-1 px-2.5 text-slate-600 font-sans">Estimated GST ({taxRate}%):</td>
                      <td className="py-1 px-2.5 text-right font-semibold text-slate-800">
                        {formatCurrency(taxAmount)}
                      </td>
                    </tr>
                    <tr className="bg-slate-200/80 font-bold text-slate-950 text-xs">
                      <td className="py-1.5 px-2.5 font-sans uppercase">Grand Total:</td>
                      <td className="py-1.5 px-2.5 text-right font-mono text-sm text-teal-900">
                        {formatCurrency(grandTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Amount in words */}
            <div className="p-2 bg-slate-100 border border-slate-300 mb-4 text-[10px]">
              <span className="font-bold text-slate-800">Amount in Words: </span>
              <span className="font-semibold italic text-slate-900">
                {numberToWordsIndian(grandTotal)}
              </span>
            </div>

            {/* Terms and Conditions Block */}
            <div className="border border-slate-300 rounded p-2.5 mb-6 text-[9px] text-slate-700 bg-slate-50/50">
              <div className="font-bold text-slate-900 uppercase tracking-wider mb-1">
                Terms &amp; Conditions / Commercial Declaration:
              </div>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Billing size is computed on standard commercial 6-inch multiple grid.</li>
                <li>50% advance along with confirmed order, balance prior to delivery/dispatch.</li>
                <li>Glass once cut, drilled, or tempered cannot be altered, cancelled, or returned.</li>
                <li>Transportation and site unloading at client risk unless expressly contracted.</li>
                <li>Subject to Nagpur jurisdiction.</li>
                {quotation.notes && (
                  <li className="font-semibold text-slate-900">
                    Special terms: {quotation.notes}
                  </li>
                )}
              </ol>
            </div>
          </div>

          {/* Signatory Box */}
          <div className="pt-6 border-t border-slate-400 flex justify-between items-end print-avoid-break">
            <div className="text-center w-48">
              <div className="border-b border-slate-400 h-10 mb-1" />
              <div className="text-[10px] font-bold text-slate-800 uppercase">
                Customer Acceptance
              </div>
              <div className="text-[9px] text-slate-500">Signature &amp; Stamp</div>
            </div>

            {/* Status Stamp in Signatory / Authorization Section */}
            <div className="text-center pb-2">
              <QuotationSeal status={quotation.status} size="md" />
            </div>

            <div className="text-center w-56">
              <div className="text-[10px] font-bold text-slate-900 uppercase mb-8">
                For SADAR GLASS &amp; ALLUMINIUM
              </div>
              <div className="border-b border-slate-400 mb-1" />
              <div className="text-[10px] font-bold text-slate-800 uppercase">
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(content, document.body)
    : content;
};

export default QuotationPrintView;
