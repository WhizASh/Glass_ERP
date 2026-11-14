import React, { useState } from 'react';
import { X, Plus, Calculator, Layers } from 'lucide-react';
import QuotationSectionCard from './QuotationSectionCard';
import QuotationBuilderMeta from './QuotationBuilderMeta';
import QuotationBuilderFooter from './QuotationBuilderFooter';
import QuickCustomerModal from '../../common/QuickCustomerModal';
import QuickProductSkuModal from '../../common/QuickProductSkuModal';
import { calculateQuotationTotals, convertRateBetweenUnits } from '../../../lib/glassCalculations';

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
      const unit = formData.measurementUnit || 'SQ_FT';
      const initialRate = unit === 'SQ_METER'
        ? convertRateBetweenUnits(newProduct.unitPrice, 'SQ_FT', 'SQ_METER')
        : Number(newProduct.unitPrice);

      setFormData((prev) => {
        const updated = [...prev.sections];
        if (updated[sectionIndex] && updated[sectionIndex].items[itemIndex]) {
          updated[sectionIndex].items[itemIndex] = {
            ...updated[sectionIndex].items[itemIndex],
            productSkuId: newProduct.id,
            unitPrice: initialRate,
            description: `${newProduct.name} (${newProduct.thicknessMm}mm - ${newProduct.glassType})`
          };
        }
        return { ...prev, sections: updated };
      });
    }
    setActiveSkuTarget(null);
  };

  // Unit change handler: converts all existing line item rates automatically
  const handleUnitChange = (newUnit) => {
    const oldUnit = formData.measurementUnit || 'SQ_FT';
    if (newUnit === oldUnit) return;

    setFormData((prev) => {
      const updatedSections = (prev.sections || []).map((sec) => ({
        ...sec,
        items: (sec.items || []).map((item) => {
          const currentRate = parseFloat(item.unitPrice) || 0;
          const convertedRate = currentRate > 0
            ? convertRateBetweenUnits(currentRate, oldUnit, newUnit)
            : 0;

          return {
            ...item,
            unitPrice: convertedRate
          };
        })
      }));

      return {
        ...prev,
        measurementUnit: newUnit,
        sections: updatedSections
      };
    });
  };

  // Calculate live commercial totals
  const currentUnit = formData.measurementUnit || 'SQ_FT';
  const totals = calculateQuotationTotals(
    formData.sections,
    formData.discountType || 'PERCENTAGE',
    formData.discountValue || 0,
    formData.taxRate !== undefined ? formData.taxRate : 18,
    currentUnit
  );

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="builder-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto no-print"
      >
        <div
          onClick={onClose}
          className="fixed inset-0 bg-steel-950/60 backdrop-blur-xs transition-opacity"
        />

        <div className="relative w-full max-w-5xl bg-white rounded-xl border border-steel-200 shadow-2xl z-10 my-2 sm:my-4 flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-98 duration-150">
          {/* Header */}
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 bg-[#0f172a] text-white flex items-center justify-between border-b border-slate-800 shrink-0 gap-2">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="builder-title" className="text-xs sm:text-sm font-bold tracking-tight text-white flex items-center gap-2 truncate">
                  <Calculator className="w-4 h-4 text-edge-400 shrink-0" />
                  <span className="truncate">{editingQuotation ? `Edit Quotation #${editingQuotation.quoteNumber}` : 'Glass Quotation & Glazing Takeoff Builder'}</span>
                </h2>
                {editingQuotation && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 uppercase font-semibold shrink-0">
                    {editingQuotation.status}
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-steel-400 mt-0.5 truncate">
                {editingQuotation
                  ? 'Update customer details, dimensions in inches, pricing, discount, and notes.'
                  : 'Input dimensions in inches; billing sizes automatically round to commercial 6" slabs with live sqft'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-steel-400 hover:text-white hover:bg-steel-800 transition-colors shrink-0"
              aria-label="Close quote builder"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 sm:space-y-5">
            {/* Meta Block (Customer + Validity + Conversion Unit + GST) */}
            <QuotationBuilderMeta
              formData={formData}
              setFormData={setFormData}
              customers={customers}
              onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
              onUnitChange={handleUnitChange}
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
                  measurementUnit={currentUnit}
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
              measurementUnit={currentUnit}
              totals={totals}
            />

            {/* Actions Bar */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5 pt-3 border-t border-steel-200">
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
