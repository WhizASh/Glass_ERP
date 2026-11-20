import DialogHeader from '../../common/DialogHeader';
import React, { useState } from 'react';
import { Plus, Layers } from 'lucide-react';
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
        className="app-dialog app-dialog-overlay z-50 no-print"
      >
        <div
          onClick={onClose}
          className="app-dialog-backdrop"
        />

        <div className="app-dialog-panel max-w-7xl">
          <DialogHeader titleId="builder-title"
            title={editingQuotation ? `Edit quotation · ${editingQuotation.quoteNumber}` : 'New quotation'}
            subtitle="Set up the customer, glass sections, dimensions and pricing."
            busy={isSubmitting || isAddCustomerOpen || isAddSkuOpen} onClose={onClose} />

          {/* Form */}
          <form onSubmit={onSubmit} className="app-dialog-form">
            <div className="app-dialog-fields">
            <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0 space-y-4">
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

            <div className="rounded-lg border border-steel-200 bg-white p-3 sm:p-4">
              <label htmlFor="quotation-notes" className="mb-2 block text-xs font-medium text-steel-600">Commercial terms & fabrication notes</label>
              <textarea id="quotation-notes" rows={3} value={formData.notes || ''}
                onChange={(event) => setFormData(current => ({ ...current, notes: event.target.value }))}
                placeholder="Lead time, warranty, fabrication and transport terms…" className="w-full rounded-md" />
            </div>
            </div>
            {/* Live amount summary */}
            <QuotationBuilderFooter
              discountType={formData.discountType || 'PERCENTAGE'}
              onDiscountTypeChange={(val) => setFormData({ ...formData, discountType: val })}
              discountValue={formData.discountValue}
              onDiscountValueChange={(val) => setFormData({ ...formData, discountValue: val })}
              taxRate={formData.taxRate ?? 18}
              onTaxRateChange={(val) => setFormData(current => ({ ...current, taxRate: val }))}
              measurementUnit={currentUnit}
              totals={totals}
            />

            </div>
            {/* Actions Bar */}
            </div>
            <div className="app-dialog-actions">
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
