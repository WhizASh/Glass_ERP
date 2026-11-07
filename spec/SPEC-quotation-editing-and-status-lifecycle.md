# Spec: Quotation Editing and Status Lifecycle Guards

## Objective
Enable full editing capabilities for glass quotations while they remain in flexible pipeline stages (`DRAFT` and `SENT` / "Sent / In Review"), while enforcing strict state guardrails:
1. **Editable in DRAFT & SENT**: Users can re-open and modify customer assignment, quotation dates, sections, item cut dimensions (inches), glass SKU selections, quantities, prices, discounts, GST rates, and notes whenever a quote is in `DRAFT` or `SENT` status.
2. **Locked in Final Stages**: Once a quotation is `ACCEPTED` or `CANCELLED`, edits are prohibited both in the UI and enforced at the API layer.
3. **Cancelled State Guardrail**: When a quotation is `CANCELLED`, the **Accept Quote** action button must completely disappear, preventing invalid transitions from a terminated quote to an accepted order.

---

## Assumptions Surfaced
1. **Status naming**: In the database and API, the status string for "Sent / In Review" is `'SENT'`, rendered as "Sent / In Review" via `StatusBadge.jsx`. Both `'DRAFT'` and `'SENT'` allow editing.
2. **Editing mechanism**: The existing `QuotationBuilderModal` component will be reused for both Creation and Editing by accepting an edit mode payload (`editingQuotation`), prepopulating all fields, and submitting via `PUT /api/quotations/:id`.
3. **Preserving Quote Number**: When editing an existing quotation, its original `quoteNumber` (e.g., `QT-260301`) must be preserved and not regenerated.
4. **Recalculations**: Updating line items triggers the standard glass takeoff calculation rules (commercial 6-inch rounding, square footage, line totals, discounts, and GST).
5. **No DB Migration Needed**: The current `quotations`, `quotation_sections`, and `quotation_items` relational schema already supports all necessary fields; only API controller logic and frontend components require modification.

---

## Tech Stack
- **Frontend**: React 18 (`react`, `react-dom`), Tailwind CSS v3.4, Vite 6, Lucide React icons.
- **Backend**: Node.js, Express.js v4.21, Prisma ORM v6.4 (with graceful in-memory store fallback for offline/disconnected DB), PostgreSQL.

---

## Commands
```bash
# Development
npm run dev                    # Run both backend (:5000) and frontend (:5173) concurrently
npm --prefix backend run dev   # Start Express backend with nodemon
npm --prefix frontend run dev  # Start Vite frontend dev server

# Verification & Build
npm run build:frontend         # Vite production build validation
node backend/src/index.js      # Direct backend startup test
```

---

## Project Structure & File Locations
```
GLass_ERP/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── quotations.controller.js  # Add updateQuotation (with status guards & recalculation)
│   │   └── routes/
│   │       └── quotations.routes.js      # Add PUT /:id route
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js                    # Add updateQuotation(id, data)
│   │   ├── components/
│   │   │   ├── views/
│   │   │   │   └── QuotationsView.jsx    # Orchestrate edit modal state & submission
│   │   │   ├── quotations/
│   │   │   │   ├── QuotationTable.jsx    # Add Edit action icon for DRAFT & SENT quotes
│   │   │   │   ├── QuotationDrawer.jsx   # Add Edit action & hide 'Accept Quote' when CANCELLED
│   │   │   │   └── builder/
│   │   │   │       └── QuotationBuilderModal.jsx # Support edit mode title & submission
└── spec/
    └── SPEC-quotation-editing-and-status-lifecycle.md
```

---

## Code Style & Implementation Details

### 1. Quotation Drawer Action Button Visibility Rules
In `QuotationDrawer.jsx`, pipeline action buttons reflect the quote lifecycle:
```jsx
{/* Mark Sent: Only available when DRAFT */}
{currentQuote.status === 'DRAFT' && (
  <button onClick={() => handleStatusChange('SENT')}>
    <Send className="w-3 h-3" /> Mark Sent
  </button>
)}

{/* Accept Quote: Only available when not ACCEPTED and not CANCELLED */}
{currentQuote.status !== 'ACCEPTED' && currentQuote.status !== 'CANCELLED' && (
  <button onClick={() => handleStatusChange('ACCEPTED')}>
    <CheckCircle2 className="w-3 h-3" /> Accept Quote
  </button>
)}

{/* Cancel: Available unless already CANCELLED */}
{currentQuote.status !== 'CANCELLED' && (
  <button onClick={() => handleStatusChange('CANCELLED')}>
    <Ban className="w-3 h-3" /> Cancel
  </button>
)}

{/* Edit Quotation: Available only when DRAFT or SENT */}
{(currentQuote.status === 'DRAFT' || currentQuote.status === 'SENT') && (
  <button onClick={() => onEditQuotation(currentQuote)}>
    <Edit3 className="w-3 h-3" /> Edit Quotation
  </button>
)}
```

### 2. Quotation Table Row Actions
In `QuotationTable.jsx`, add an edit button to the action cell:
```jsx
{(quote.status === 'DRAFT' || quote.status === 'SENT') && (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onEditQuotation(quote);
    }}
    className="p-1 rounded text-steel-500 hover:text-edge-700 hover:bg-steel-100 transition-colors"
    title="Edit Quotation"
    aria-label={`Edit quotation ${quote.quoteNumber}`}
  >
    <Edit3 className="w-4 h-4" />
  </button>
)}
```

### 3. Backend Controller & Status Guards (`PUT /api/quotations/:id`)
```javascript
const updateQuotation = async (req, res) => {
  const { id } = req.params;
  const {
    customerId,
    validUntil,
    discountType = 'PERCENTAGE',
    discountValue = 0,
    taxRate = 0,
    notes,
    sections = []
  } = req.body;

  // 1. Fetch existing quotation to verify status
  // 2. Reject if quotation is not found (404)
  // 3. Reject if status is 'ACCEPTED' or 'CANCELLED' (400: "Cannot edit quotation in [STATUS] status")
  // 4. Calculate recalculations (inch 6" rounding, sqft, subtotal, discount, tax, total)
  // 5. Update quote and replace/sync sections & items in Prisma and in-memory store
  // 6. Return updated quotation with full relations
};
```

---

## Testing & Verification Strategy
1. **Unit / Logic Checks**:
   - Verify `currentQuote.status === 'CANCELLED'` results in "Accept Quote" button being absent in DOM.
   - Verify `currentQuote.status === 'DRAFT'` displays both "Edit" and "Accept Quote".
   - Verify `currentQuote.status === 'SENT'` displays both "Edit" and "Accept Quote".
   - Verify `currentQuote.status === 'ACCEPTED'` hides "Edit" and hides "Accept Quote".
2. **API Verification**:
   - Create quote -> `PUT /api/quotations/:id` succeeds when status is `DRAFT` or `SENT`.
   - Update quote to `CANCELLED` -> `PUT /api/quotations/:id` returns `400 Bad Request`.
   - Update quote to `ACCEPTED` -> `PUT /api/quotations/:id` returns `400 Bad Request`.
3. **End-to-End User Flow**:
   - Open quotation in `DRAFT` or `SENT` via table edit icon or drawer edit button.
   - Modify line dimensions, add/remove sections, change discount.
   - Save changes -> verify table and drawer immediately reflect updated totals and details.
   - Transition to `CANCELLED` -> verify "Accept Quote" and "Edit Quotation" are gone.

---

## Boundaries
- **Always do**:
  - Maintain inch-based 6" rounding and sqft calculation consistency during updates.
  - Preserve the original `quoteNumber` and creation timestamp when editing.
  - Keep support for both PostgreSQL/Prisma and in-memory fallback stores.
- **Ask first**:
  - Permitting edits on `ACCEPTED` quotations (e.g. if an accepted quote needs revision before production).
  - Changing database schema or adding new statuses beyond DRAFT, SENT, ACCEPTED, CANCELLED.
- **Never do**:
  - Allow an update request to succeed on a `CANCELLED` or `ACCEPTED` quotation without explicit un-cancelling or revision workflows.
  - Remove failing tests or bypass error handling.

---

## Success Criteria
- [ ] Quotations in `DRAFT` or `SENT` status have clear "Edit" buttons in both `QuotationTable` and `QuotationDrawer`.
- [ ] Clicking "Edit" populates the `QuotationBuilderModal` with the quote's existing customer, sections, dimensions, quantities, rates, discounts, and notes.
- [ ] Saving edits invokes `PUT /api/quotations/:id`, recalculating commercial totals and updating the quote in real-time.
- [ ] Quotations in `ACCEPTED` or `CANCELLED` status cannot be edited via UI or backend API.
- [ ] When a quotation is `CANCELLED`, the "Accept Quote" button is not visible anywhere in the UI.

---

## Decisions & Clarifications
1. **Status retention upon editing**: When a quotation in `SENT` ("Sent / In Review") is edited, its status remains `SENT`. Similarly, editing a `DRAFT` quotation keeps it in `DRAFT`.
2. **Permanent Cancellation**: When a quotation is `CANCELLED`, it is permanently locked. No reopening is permitted, and the "Accept Quote" button is permanently hidden. Edits on cancelled quotes are rejected at both UI and API levels.
