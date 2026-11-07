# Spec: Quotation Builder with Inch-Based Sqft Rounding, In-Place Creation, Discounts & PDF/Print

## Objective
Enhance the Glass ERP system with an end-to-end, multi-section glass quotation engine and an exact printable/PDF export view matching the industry-standard quotation design shown in the reference spreadsheet (`Screenshot 2026-11-06 153108.png`).

Key capabilities:
1. **Multi-Section Glazing Takeoff**: Organize quotes by architectural zones/floors (e.g., "1st Floor", "2nd Floor", "Facade") with dynamic add/remove sections and items.
2. **Direct Inch-Based Dimension & Sqft Rounding**: Input dimensions directly in **inches (in)**. Automatically round each dimension to the nearest multiple of 6 inches (the standard commercial billing grid) to compute square footage without requiring any selector:
   $$\text{roundedWidthIn} = \max(6, \text{round}(\text{widthInches} / 6) \times 6)$$
   $$\text{roundedHeightIn} = \max(6, \text{round}(\text{heightInches} / 6) \times 6)$$
   $$\text{Sqft} = \frac{\text{roundedWidthIn} \times \text{roundedHeightIn}}{144}$$
   $$\text{Line Amount} = \text{Qty} \times \text{Sqft} \times \text{Rate/Sqft}$$
3. **In-Place Quick Creation**: Allow users to instantly add a missing Customer or Glass Product SKU directly within the quotation builder modal via seamless inline creation modals without navigating away or losing form state.
4. **Discount Modifier**: Provide a discount input with a modifier toggle (Percentage `%` vs. Fixed Amount `₹`), deducting discount from the fabrication subtotal before GST calculations.
5. **Print & PDF Generation via `window.print()`**: Deliver a dedicated, pixel-perfect printable layout replicating the reference spreadsheet design (company header for "Sadar Glass & Alluminium", client box, introductory greeting, hierarchical S. No. schedule, sqft calculations, commercial breakdown, and signatory) optimized for native browser print / save-as-PDF (`window.print()`).

---

## Tech Stack
- **Frontend**: React 18 (`react`, `react-dom`), Tailwind CSS v3.4, Vite 6, Lucide React icons.
- **Backend**: Node.js, Express.js v4.21, Prisma ORM v6.4, PostgreSQL.
- **Printing/PDF**: Native browser print (`window.print()`) with print stylesheet (`@media print` for A4 portrait).

---

## Commands
```bash
# Development
npm run dev                  # Concurrently start backend (port 5000) and frontend (port 5173)
npm --prefix backend run dev # Start Express API with nodemon
npm --prefix frontend run dev# Start Vite dev server

# Database & Migrations
npm --prefix backend run prisma:migrate -- --name add_quotation_inch_discount_and_sqft
npm --prefix backend run prisma:generate

# Build & Quality Check
npm run build:frontend       # Run Vite production build (outputs to frontend/dist)
node backend/src/index.js    # Start Express API server directly
```

---

## Project Structure
```
GLass_ERP/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma                    # Quotation, QuotationSection, QuotationItem schema
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── customers.controller.js      # Customer endpoints (includes quick-create)
│   │   │   ├── products.controller.js       # Product SKU endpoints (includes quick-create)
│   │   │   └── quotations.controller.js     # Quotation CRUD with inches, discount & sqft totals
│   │   ├── routes/
│   │   │   └── quotations.routes.js
│   │   └── index.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── QuickCustomerModal.jsx   # In-place customer quick creator
│   │   │   │   └── QuickProductSkuModal.jsx # In-place glass SKU quick creator
│   │   │   ├── quotations/
│   │   │   │   ├── QuotationDrawer.jsx       # Drawer with quote preview, status, and print trigger
│   │   │   │   ├── QuotationPrintView.jsx    # Dedicated printable sheet matching reference design
│   │   │   │   └── builder/
│   │   │   │       ├── QuotationBuilderModal.jsx # Main multi-section quotation modal
│   │   │   │       ├── QuotationBuilderMeta.jsx  # Client selector + Quick Add customer
│   │   │   │       ├── QuotationSectionCard.jsx  # Dynamic section container (Add/Remove)
│   │   │   │       ├── QuotationLineItemRow.jsx  # Item row with inches->sqft rounder & Quick Add SKU
│   │   │   │       └── QuotationBuilderFooter.jsx# Subtotal, discount modifier, GST & net total
│   │   │   └── views/
│   │   │       └── QuotationsView.jsx
│   │   ├── lib/
│   │   │   └── glassCalculations.js         # Direct inch rounding formulas (fixed nearest multiple of 6)
│   │   └── services/
│   │       └── api.js                       # API calls for quotations, customers, and products
└── spec/
    └── SPEC-quotation-builder-and-pdf.md    # This specification file
```

---

## Code Style & Implementation Details

### 1. Direct Inch Rounding & Sqft Formula
Dimensions are specified directly in **inches (in)**.
- Input dimensions: `widthInches`, `heightInches`.
- Rounding: Each dimension is automatically rounded to the nearest multiple of 6 inches:
  - $\text{roundedInches} = \max(6, \text{round}(\text{inputInches} / 6) \times 6)$
  - *Example: 57" width $\rightarrow 60"$ (5.0 ft); 44" height $\rightarrow 48"$ (4.0 ft).*
- Sqft Calculation:
  $$\text{Sqft} = \frac{\text{roundedWidthIn} \times \text{roundedHeightIn}}{144}$$
- Line Item Total:
  $$\text{LineTotal} = \text{quantity} \times \text{Sqft} \times \text{ratePerSqft}$$

```javascript
// src/lib/glassCalculations.js
export const roundDimensionTo6Inches = (inches) => {
  const val = parseFloat(inches);
  if (!val || val <= 0) return 0;
  return Math.max(6, Math.round(val / 6) * 6);
};

export const calculateItemSqft = (widthInches, heightInches) => {
  const w = roundDimensionTo6Inches(widthInches);
  const h = roundDimensionTo6Inches(heightInches);
  if (w <= 0 || h <= 0) return 0;
  return Number(((w * h) / 144).toFixed(2));
};
```

### 2. Quotation Line Item Row UI
In `QuotationLineItemRow.jsx`:
- **Glass SKU Selector**: Dropdown showing SKU code, name, thickness, rate/sqft + inline `+ Add SKU` button.
- **Width (in)**: Numeric input in inches (e.g., `57` or `56.5`).
- **Height (in)**: Numeric input in inches (e.g., `44` or `43.5`).
- **Billing Size (in)**: Read-only badge displaying rounded dimensions (e.g., `60" × 48"`).
- **Sqft**: Read-only calculated square feet (e.g., `20.00 sqft`).
- **Qty**: Quantity input (default `1`).
- **Rate (₹/sqft)**: Unit price per square foot (auto-populated from SKU, editable).
- **Line Total (₹)**: `Qty * Sqft * Rate`.
- **Remove Action**: Trash icon to delete row.

### 3. In-Place Quick Add Modals
- When customer is not present $\rightarrow$ User clicks `+ Add Customer` in `QuotationBuilderMeta`.
- When glass SKU is not present $\rightarrow$ User clicks `+ Add SKU` in `QuotationLineItemRow`.
- Inline modal captures required fields:
  - Customer: Name, Company Name, Phone, City, Address, GSTIN.
  - Product SKU: SKU Code, Name, Glass Type, Thickness (mm), Unit Price (₹/sqft), Description.
- On save, saves via API, updates local state array, and selects newly added item in-place without page refresh or data loss.

### 4. Discount Modifier & Commercial Summary
In `QuotationBuilderFooter.jsx`:
- **Discount Type Modifier**: Dropdown / Button toggle: `Percentage (%)` or `Fixed (₹)`.
- **Discount Value Input**: Number input (e.g., `5` for 5%, or `5000` for ₹5,000).
- **Calculation Chain**:
  1. $\text{Fabrication Subtotal} = \sum (\text{LineTotals})$
  2. $\text{Discount} = \text{type} == '\%' ? (\text{Subtotal} \times \text{val}) / 100 : \min(\text{val}, \text{Subtotal})$
  3. $\text{Taxable Subtotal} = \text{Subtotal} - \text{Discount}$
  4. $\text{GST} = (\text{Taxable Subtotal} \times \text{taxRate}) / 100$
  5. $\text{Grand Total} = \text{Taxable Subtotal} + \text{GST}$

### 5. Printable Quotation Matching Reference Design
Replicates the spreadsheet structure with clean typography:
- **Header Block**: Company info ("Sadar Glass & Alluminium", address, phone, GSTIN) on the left; Date and Quote Number on the right.
- **Client Block**: "To :- [Customer Name]", City, Address.
- **Introductory Note**: Standard glass and aluminium guarantee declaration.
- **Schedule Table**:
  - `S. No.` (hierarchical: `1` for Section, `1.1`, `1.2`, `2`, `2.1`...)
  - `Description` (Section name e.g. "1 St Floor" / Item dimensions e.g. `60" x 48"` or SKU name)
  - `Qty`
  - `Sqft`
  - `Rate/Sq.ft`
  - `Amount`
- **Totals Block**: Total Sqft, Subtotal, Discount row (showing modifier % or ₹), GST amount, Grand Total in Indian Rupee format (`₹XX,XXX.00`).
- **Print Optimization**: A4 print page styles `@page { size: A4 portrait; margin: 12mm; }`, eliminating URL headers, footers, buttons, and sidebars, triggered cleanly via `window.print()`.

---

## Testing Strategy
1. **Glass Rounding & Calculation Unit Tests**:
   - Verify inch rounding:
     - 57" $\rightarrow$ 60"
     - 44" $\rightarrow$ 48"
     - Area: $(60 \times 48) / 144 = 20.00\text{ sqft}$
     - 76.5" $\rightarrow$ 78", 56.5" $\rightarrow$ 60" $\rightarrow (78 \times 60) / 144 = 32.50\text{ sqft}$
     - 34" $\rightarrow$ 36", 51" $\rightarrow$ 54" $\rightarrow (36 \times 54) / 144 = 13.50\text{ sqft}$
2. **Discount Calculation Unit Tests**:
   - Percentage discount (e.g., 5% on ₹1,00,000 = ₹5,000 discount, taxable = ₹95,000, 18% GST = ₹17,100, grand total = ₹1,12,100).
   - Fixed discount (e.g., ₹2,500 off subtotal).
3. **API Integration Tests**:
   - Verify `POST /api/quotations` creates multi-section records with inch dimensions, discount fields, and calculated sqft.
   - Verify in-place customer creation `POST /api/customers` and product creation `POST /api/products`.
4. **UI Verification**:
   - Verify input fields accept inches (decimals supported, e.g. `56.5`).
   - Manual test adding/removing sections and items.
   - Manual test inline customer and product modal creation without page reload.
   - Print preview test in browser ensuring page breaks and column alignment match the screenshot reference.

---

## Boundaries
- **Always do**:
  - Keep dimensions in inches throughout the quotation form and calculations.
  - Maintain backwards compatibility for existing quotations.
  - Round currency values to 2 decimal places using Indian numbering formatting (`en-IN`).
  - Validate that width, height, quantity, and unit rate are positive numbers.
  - Preserve all entered line items when opening or closing in-place creation dialogs.
- **Ask first**:
  - Executing Prisma migrations modifying the PostgreSQL database schema.
  - Adding third-party external dependencies.
- **Never do**:
  - Convert or store inches as millimeters in the quotation form.
  - Hardcode company GSTIN or company names without allowing them to be configured or fall back safely.
  - Truncate or reset quotation builder form inputs on dropdown selections.
  - Break existing sales order conversions from accepted quotations.

---

## Success Criteria
1. **Inch Dimension Inputs**: Quotation builder line items take dimensions directly in inches (`widthInches`, `heightInches`), with automatic calculation of rounded billing inches (nearest multiple of 6) and square footage (`Sqft = (W * H) / 144`).
2. **Section Management**: Users can dynamically create, rename, and delete architectural sections (e.g., "1st Floor", "2nd Floor"). Sections can have 1 or more items.
3. **In-Place Customer & SKU Creation**: If a customer or glass SKU is missing in the dropdown, the user can create it immediately via an inline modal dialog, which persists to the database and automatically selects it in the form without losing any entered data.
4. **Discount Modifier**: Users can select either Percentage (`%`) or Fixed Amount (`₹`) discount; the discount is applied to the subtotal and reflected across line totals, taxes, and grand totals.
5. **Print & PDF View**: Clicking "Print / Save PDF" triggers `window.print()` with a clean, formatted quotation document matching the reference design from `Screenshot 2026-11-06 153108.png`, complete with company header, client block, hierarchical S. No. table, sqft and rate columns, commercial summary, and A4 print styles.
6. **Backend Persistence**: Quotation save payload correctly captures sections, items, inch dimensions, calculated sqft, discount type, discount value, discount amount, tax amount, and total amount.

---

## Open Questions & Clarifications
*All questions are resolved:*
- **Rounding Grid**: Fixed to standard nearest multiple of 6 inches (no UI selector needed).
- **PDF & Printing**: Native `window.print()` with dedicated `@media print` CSS stylesheet (no extra libraries needed).
