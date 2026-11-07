import React, { useState } from 'react';
import { X, Plus, Calculator, Layers } from 'lucide-react';
import QuotationSectionCard from './QuotationSectionCard';
import QuotationBuilderMeta from './QuotationBuilderMeta';
import QuotationBuilderFooter from './QuotationBuilderFooter';
import QuickCustomerModal from '../../common/QuickCustomerModal';
import QuickProductSkuModal from '../../common/QuickProductSkuModal';
import { calculateQuotationTotals } from '../../../lib/glassCalculations';

const QuotationBuilderModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  customers = [],
  setCustomers,
  products = [],
  setProducts,
  onSubmit,
  isSubmitting,
  editingQuotation = null
}) => {
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddSkuOpen, setIsAddSkuOpen] = useState(false);
  const [activeSkuTarget, setActiveSkuTarget] = useState(null); // { sectionIndex, itemIndex }

  if (!isOpen) return null;

  const handleAddSection = () => {
    setFormData((prev) => {
      const currentSections = prev.sections || [];
      return {
        ...prev,
        sections: [
          ...currentSections,
          {
            sectionName: `Section ${currentSections.length + 1} (e.g. Floor / Elevation)`,
            items: [
              {
                productSkuId: '',
                description: '',
                widthInches: '',
                heightInches: '',
                quantity: 1,
                unitPrice: 0
              }
            ]
          }
        ]
      };
    });
  };

  const handleRemoveSection = (sectionIndex) => {
    setFormData((prev) => {
      const currentSections = prev.sections || [];
      if (currentSections.length <= 1) return prev;
      return {
        ...prev,
        sections: currentSections.filter((_, idx) => idx !== sectionIndex)
      };
    });
  };

  const handleUpdateSectionName = (sectionIndex, name) => {
    setFormData((prev) => ({
      ...prev,
      sections: (prev.sections || []).map((sec, idx) =>
        idx === sectionIndex ? { ...sec, sectionName: name } : sec
      )
    }));
  };

  const handleAddItem = (sectionIndex) => {
    setFormData((prev) => ({
      ...prev,
      sections: (prev.sections || []).map((sec, idx) =>
        idx === sectionIndex
          ? {
              ...sec,
              items: [
                ...sec.items,
                {
                  productSkuId: '',
                  description: '',
                  widthInches: '',
                  heightInches: '',
                  quantity: 1,
                  unitPrice: 0
                }
              ]
            }
          : sec
      )
    }));
  };

  const handleRemoveItem = (sectionIndex, itemIndex) => {
    setFormData((prev) => ({
      ...prev,
      sections: (prev.sections || []).map((sec, idx) =>
        idx === sectionIndex
          ? {
              ...sec,
              items: sec.items.filter((_, iIdx) => iIdx !== itemIndex)
            }
          : sec
      )
    }));
  };

  const handleUpdateField = (sectionIndex, itemIndex, field, value) => {
    setFormData((prev) => ({
      ...prev,
      sections: (prev.sections || []).map((sec, idx) =>
        idx === sectionIndex
          ? {
              ...sec,
              items: sec.items.map((item, iIdx) =>
                iIdx === itemIndex ? { ...item, [field]: value } : item
              )
            }
          : sec
      )
    }));
  };

  // Open Quick SKU Modal targeting a specific line item
  const handleOpenAddSku = (sectionIndex, itemIndex) => {
    setActiveSkuTarget({ sectionIndex, itemIndex });
    setIsAddSkuOpen(true);
  };

  // Callback when a customer is added via QuickCustomerModal
  const handleCustomerCreated = (newCustomer) => {
    if (setCustomers) {
      setCustomers((prev) => [newCustomer, ...prev]);
    }
    setFormData((prev) => ({
      ...prev,
      customerId: newCustomer.id
    }));
  };

  // Callback when a product SKU is added via QuickProductSkuModal
  const handleProductCreated = (newProduct) => {
    if (setProducts) {
      setProducts((prev) => [newProduct, ...prev]);
    }
    if (activeSkuTarget) {
      const { sectionIndex, itemIndex } = activeSkuTarget;
      setFormData((prev) => {
        const updated = [...prev.sections];
        if (updated[sectionIndex] && updated[sectionIndex].items[itemIndex]) {
          updated[sectionIndex].items[itemIndex] = {
            ...updated[sectionIndex].items[itemIndex],
            productSkuId: newProduct.id,
            unitPrice: Number(newProduct.unitPrice),
            description: `${newProduct.name} (${newProduct.thicknessMm}mm - ${newProduct.glassType})`
          };
        }
        return { ...prev, sections: updated };
      });
    }
    setActiveSkuTarget(null);
  };

  // Calculate live commercial totals
  const totals = calculateQuotationTotals(
    formData.sections,
    formData.discountType || 'PERCENTAGE',
    formData.discountValue || 0,
    formData.taxRate !== undefined ? formData.taxRate : 18
  );

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="builder-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print"
      >
        <div
          onClick={onClose}
          className="fixed inset-0 bg-steel-950/60 backdrop-blur-xs transition-opacity"
        />

        <div className="relative w-full max-w-5xl bg-white rounded-xl border border-steel-200 shadow-2xl z-10 my-4 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-98 duration-150">
          {/* Header */}
          <div className="px-5 py-3.5 bg-[#0f172a] text-white flex items-center justify-between border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 id="builder-title" className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-edge-400" />
                  <span>{editingQuotation ? `Edit Quotation #${editingQuotation.quoteNumber}` : 'Glass Quotation & Glazing Takeoff Builder'}</span>
                </h2>
                {editingQuotation && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 uppercase font-semibold">
                    {editingQuotation.status}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-steel-400 mt-0.5">
                {editingQuotation
                  ? 'Update customer details, dimensions in inches, pricing, discount, and notes.'
                  : 'Input dimensions in inches; billing sizes automatically round to commercial 6" slabs with live sqft'}
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

          {/* Form */}
          <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Meta Block (Customer + Validity + GST) */}
            <QuotationBuilderMeta
              formData={formData}
              setFormData={setFormData}
              customers={customers}
              onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
            />

            {/* Sections Container */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-steel-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-700" />
                  <span>Project Floor & Elevation Sections ({formData.sections ? formData.sections.length : 0})</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Architectural Section</span>
                </button>
              </div>

              {(formData.sections || []).map((section, sIdx) => (
                <QuotationSectionCard
                  key={sIdx}
                  section={section}
                  sectionIndex={sIdx}
                  products={products}
                  onUpdateSectionName={handleUpdateSectionName}
                  onAddItem={handleAddItem}
                  onRemoveItem={handleRemoveItem}
                  onUpdateField={handleUpdateField}
                  onOpenAddSku={handleOpenAddSku}
                  onRemoveSection={handleRemoveSection}
                  canRemoveSection={(formData.sections || []).length > 1}
                />
              ))}

              {/* Bottom Add Architectural Section Banner Card */}
              <button
                type="button"
                onClick={handleAddSection}
                className="w-full py-3 px-4 border-2 border-dashed border-steel-300 hover:border-teal-600 bg-steel-50/60 hover:bg-teal-50/40 rounded-lg text-xs font-bold text-steel-700 hover:text-teal-800 flex items-center justify-center gap-2 transition-all shadow-2xs group cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-steel-200 group-hover:bg-teal-600 text-steel-700 group-hover:text-white flex items-center justify-center transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span>+ Add Architectural Section (Floor / Elevation / Zone)</span>
              </button>
            </div>

            {/* Footer Block (Notes + Discount Modifier + Live Totals) */}
            <QuotationBuilderFooter
              notes={formData.notes}
              onNotesChange={(val) => setFormData({ ...formData, notes: val })}
              discountType={formData.discountType || 'PERCENTAGE'}
              onDiscountTypeChange={(val) => setFormData({ ...formData, discountType: val })}
              discountValue={formData.discountValue}
              onDiscountValueChange={(val) => setFormData({ ...formData, discountValue: val })}
              totals={totals}
            />

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-steel-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-steel-700 bg-white border border-steel-300 rounded-md hover:bg-steel-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-md shadow-xs transition-colors"
              >
                {isSubmitting
                  ? (editingQuotation ? 'Saving Changes...' : 'Creating Quotation...')
                  : (editingQuotation ? 'Save Changes' : 'Create Glass Quotation')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* In-Place Quick Customer Creation Modal */}
      <QuickCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSuccess={handleCustomerCreated}
      />

      {/* In-Place Quick Glass SKU Creation Modal */}
      <QuickProductSkuModal
        isOpen={isAddSkuOpen}
        onClose={() => {
          setIsAddSkuOpen(false);
          setActiveSkuTarget(null);
        }}
        onSuccess={handleProductCreated}
      />
    </>
  );
};

export default QuotationBuilderModal;
