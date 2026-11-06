import React from 'react';
import { X, Plus, Calculator, Layers } from 'lucide-react';
import QuotationSectionCard from './QuotationSectionCard';
import QuotationBuilderMeta from './QuotationBuilderMeta';
import QuotationBuilderFooter from './QuotationBuilderFooter';

const QuotationBuilderModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  customers,
  products,
  onSubmit,
  isSubmitting
}) => {
  if (!isOpen) return null;

  const handleAddSection = () => {
    setFormData((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          sectionName: `Section ${prev.sections.length + 1}`,
          items: [{ productSkuId: '', description: '', widthMm: '', heightMm: '', quantity: 1, unitPrice: 0 }]
        }
      ]
    }));
  };

  const handleRemoveSection = (sectionIndex) => {
    if (formData.sections.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== sectionIndex)
    }));
  };

  const handleUpdateSectionName = (sectionIndex, name) => {
    setFormData((prev) => {
      const updated = [...prev.sections];
      updated[sectionIndex].sectionName = name;
      return { ...prev, sections: updated };
    });
  };

  const handleAddItem = (sectionIndex) => {
    setFormData((prev) => {
      const updated = [...prev.sections];
      updated[sectionIndex].items.push({
        productSkuId: '', description: '', widthMm: '', heightMm: '', quantity: 1, unitPrice: 0
      });
      return { ...prev, sections: updated };
    });
  };

  const handleRemoveItem = (sectionIndex, itemIndex) => {
    setFormData((prev) => {
      const updated = [...prev.sections];
      if (updated[sectionIndex].items.length <= 1) return prev;
      updated[sectionIndex].items = updated[sectionIndex].items.filter((_, idx) => idx !== itemIndex);
      return { ...prev, sections: updated };
    });
  };

  const handleUpdateField = (sectionIndex, itemIndex, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.sections];
      updated[sectionIndex].items[itemIndex] = { ...updated[sectionIndex].items[itemIndex], [field]: value };
      return { ...prev, sections: updated };
    });
  };

  let overallArea = 0;
  let subtotal = 0;
  formData.sections.forEach((sec) => {
    sec.items.forEach((item) => {
      const width = parseFloat(item.widthMm) || 0;
      const height = parseFloat(item.heightMm) || 0;
      const qty = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.unitPrice) || 0;
      const itemArea = width > 0 && height > 0 ? (width * height) / 1000000 : 0;
      const totalItemArea = itemArea * qty;
      overallArea += totalItemArea;
      subtotal += itemArea > 0 ? totalItemArea * price : qty * price;
    });
  });

  const taxRate = parseFloat(formData.taxRate) || 0;
  const tax = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + tax;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="builder-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div onClick={onClose} className="fixed inset-0 bg-steel-950/60 backdrop-blur-xs transition-opacity" />

      <div className="relative w-full max-w-5xl bg-white rounded-xl border border-steel-200 shadow-2xl z-10 my-4 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-98 duration-150">
        <div className="px-5 py-3.5 bg-[#0f172a] text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 id="builder-title" className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-edge-400" />
              <span>Glass Quotation & Glazing Takeoff Builder</span>
            </h2>
            <p className="text-[11px] text-steel-400 mt-0.5">
              Enter architectural zones, glass specifications, cut dimensions, and unit rates
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-steel-400 hover:text-white hover:bg-steel-800 transition-colors"
            aria-label="Close quote builder"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          <QuotationBuilderMeta
            formData={formData}
            setFormData={setFormData}
            customers={customers}
          />

          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-steel-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-edge-600" />
                <span>Project Floor & Elevation Sections ({formData.sections.length})</span>
              </span>
              <button
                type="button"
                onClick={handleAddSection}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-edge-700 hover:bg-edge-800 rounded-md shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Architectural Section</span>
              </button>
            </div>

            {formData.sections.map((section, sIdx) => (
              <QuotationSectionCard
                key={sIdx}
                section={section}
                sectionIndex={sIdx}
                products={products}
                onUpdateSectionName={handleUpdateSectionName}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
                onUpdateField={handleUpdateField}
                onRemoveSection={handleRemoveSection}
                canRemoveSection={formData.sections.length > 1}
              />
            ))}
          </div>

          <QuotationBuilderFooter
            notes={formData.notes}
            onNotesChange={(val) => setFormData({ ...formData, notes: val })}
            overallArea={overallArea}
            subtotal={subtotal}
            taxRate={taxRate}
            tax={tax}
            grandTotal={grandTotal}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-steel-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-steel-700 bg-white border border-steel-300 rounded-md hover:bg-steel-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-md shadow-xs transition-colors"
            >
              {isSubmitting ? 'Creating Quotation...' : 'Create Glass Quotation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuotationBuilderModal;
