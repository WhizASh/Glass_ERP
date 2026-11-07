# Spec: Sales Order Payment Mode, Invoice Item Auto-Populate, and Order Editing

## Objective
Enhance the Sales Orders module (`SaleOrder` model, API, and `SalesView` UI) to streamline order conversion and management for glass fabrication and delivery:
1. **Mode of Payment**: Add a `paymentMode` field to the sales model with a dropdown selector for **Cash** and **NEFT / UPI / Card** (`CASH` / `ONLINE`), persisting in the database, displaying in the orders table, and allowing updates.
2. **Auto-Populate from Invoice / Quotation with Direct Order Support**: Remove the manual product catalog SKU dropdown picker from the sales order form. Selecting an Invoice (Quotation) will automatically pull the customer and all bill-of-materials line items (descriptions, cut dimensions, quantities, unit prices, and totals) directly into the sales order. Direct manual orders without an invoice are also supported, allowing users to enter custom line items directly without SKU restrictions.
3. **Editable Sales Details & Order Editing with Status Guardrails**: Enable editing of all sales details (item quantities, unit prices, descriptions, delivery address, payment mode, payment status, fulfillment status) both during order creation and for existing orders via an **Edit** action in the Sales Orders table supported by a `PUT /api/sales/:id` endpoint. As a guardrail, editing is locked once an order is marked `DELIVERED` or `CANCELLED`.

---

## Assumptions Surfaced

```
ASSUMPTIONS I'M MAKING:
1. Invoice Reference: In the current Glass ERP architecture, "Invoice" refers to the approved/active Quotations (which serve as commercial takeoff invoices with quote/invoice numbers, customer billing, and itemized glass schedules).
2. Mode of Payment Values: The `paymentMode` field supports two primary values: 'ONLINE' and 'CASH', with 'CASH' as the default selection.
3. Item Sourcing: When an Invoice/Quotation is selected, its line items (from all sections) are copied into the Sales Order items with their existing `productSkuId`, description, cut dimensions, quantity, and unit rate.
4. Editable Line Items: Users can adjust quantities, edit rates, add custom notes/descriptions, or remove specific line items if the client requests partial fabrication or price adjustments.
5. Order Editing Scope: Existing sales orders can be edited at any time (updating items, recalculating totalAmount, updating delivery address, payment mode, payment status, and fulfillment status).
6. Pure Database Architecture: Removed all in-memory mock store fallback logic for Sales. All sales orders, updates, and fetches interact purely with PostgreSQL via Prisma. If the database is empty, it returns an empty list `[]`.
→ Correct me now or I'll proceed with these.
```

---

## Tech Stack
- **Frontend**: React 18 (`react`, `react-dom`), Vite 6, Tailwind CSS v3.4, Lucide React icons (`ShoppingBag`, `CreditCard`, `Banknote`, `Edit3`, `Plus`, `Trash2`, `Filter`).
- **Backend**: Node.js, Express.js v4.21, Prisma ORM v6.4, PostgreSQL (with in-memory fallback for local/offline resilience).

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
│   ├── prisma/
│   │   └── schema.prisma             # Add paymentMode String @default("CASH") to SaleOrder
│   ├── migrations/
│   │   └── 20261107_add_sale_payment_mode.sql # SQL migration for paymentMode column
│   ├── src/
│   │   ├── controllers/
│   │   │   └── sales.controller.js   # Add updateSale (PUT /:id), getSaleById, in-memory fallback & paymentMode support
│   │   └── routes/
│   │       └── sales.routes.js       # Add PUT /:id and GET /:id routes
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js                # Add updateSale(id, data) & getSaleById(id)
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   └── StatusBadge.jsx   # Add styling badges for ONLINE / CASH payment modes
│   │   │   └── views/
│   │   │       └── SalesView.jsx     # Invoice selection autofill, remove SKU picker, payment mode dropdown, edit order action & modal
└── spec/
    └── SPEC-sales-payment-mode-and-order-editing.md
```

---

## Data Model & API Design

### 1. Prisma Schema Changes (`schema.prisma`)
```prisma
model SaleOrder {
  id              String          @id @default(uuid())
  orderNumber     String          @unique
  customerId      String
  customer        Customer        @relation(fields: [customerId], references: [id])
  quotationId     String?
  quotation       Quotation?      @relation(fields: [quotationId], references: [id])
  status          String          @default("PENDING")
  paymentStatus   String          @default("UNPAID")
  paymentMode     String          @default("CASH") // 'ONLINE' | 'CASH'
  orderDate       DateTime        @default(now())
  deliveryAddress String?
  totalAmount     Decimal         @default(0)
  items           SaleOrderItem[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@map("sale_orders")
}
```

### 2. SQL Migration (`20261107_add_sale_payment_mode.sql`)
```sql
ALTER TABLE "sale_orders" 
ADD COLUMN IF NOT EXISTS "paymentMode" TEXT NOT NULL DEFAULT 'CASH';
```

### 3. API Endpoints

#### `POST /api/sales` (Create Sale Order)
**Payload:**
```json
{
  "customerId": "cust-nagpur-glass",
  "quotationId": "quote-sample-facade-01",
  "paymentMode": "ONLINE",
  "paymentStatus": "UNPAID",
  "status": "PENDING",
  "deliveryAddress": "Plot 14, Okhla Phase III, New Delhi",
  "items": [
    {
      "sectionName": "Ground Floor Elevation",
      "productSkuId": "sku-01",
      "description": "10mm Toughened Clear Glass (57\" x 44\")",
      "widthMm": 1447.8,
      "heightMm": 1117.6,
      "quantity": 1,
      "unitPrice": 185,
      "totalPrice": 185
    }
  ]
}
```

#### `PUT /api/sales/:id` (Update Sale Order)
**Payload:**
Same shape as `POST /api/sales`, allowing updates to `paymentMode`, `paymentStatus`, `status`, `deliveryAddress`, and `items`. The backend updates the header fields, replaces or syncs line items, recalculates `totalAmount = sum(quantity * unitPrice)`, and returns the updated `SaleOrder`.

#### `GET /api/sales/:id` (Get Sale Order by ID)
Returns single `SaleOrder` with `customer`, `quotation`, and `items.productSku`.

---

## Frontend UX & Implementation Details (`SalesView.jsx`)

### 1. Invoice Selection & Auto-Population
- Replace the independent customer selector with an **Invoice / Quotation Selector** as the starting point:
  ```jsx
  <select
    value={formData.quotationId}
    onChange={handleQuotationSelect}
    className="..."
  >
    <option value="">-- Choose Invoice / Quotation --</option>
    {quotations.map(q => (
      <option key={q.id} value={q.id}>
        {q.quoteNumber} - {q.customer?.companyName || q.customer?.name} (₹{Number(q.totalAmount).toLocaleString('en-IN')})
      </option>
    ))}
  </select>
  ```
- When an Invoice is selected:
  1. Set `formData.customerId` to `selectedQuotation.customerId`.
  2. If the customer has an address, set `formData.deliveryAddress` default.
  3. Extract line items from all sections (`quotation.sections.flatMap(sec => sec.items)`).
  4. Transform them into sales line items:
     - `description`: item.description || item.productSku?.name || 'Glass Item'
     - `sectionName`: sec.sectionName
     - `productSkuId`: item.productSkuId
     - `widthMm`: item.widthMm
     - `heightMm`: item.heightMm
     - `quantity`: Number(item.quantity) || 1
     - `unitPrice`: Number(item.unitPrice) || 0
     - `totalPrice`: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)
  5. Populate `formData.items` with these extracted items.

### 2. Removal of Manual SKU Picker & Direct Details Editing
- The manual SKU `<select>` dropdown (`-- Choose Glass SKU --`) is removed.
- In its place, the items table displays:
  - **Item / Specification**: Displays the glass item name / description and cut dimensions (inches/mm) fetched from the invoice, with an editable description input for adjustments.
  - **Qty**: Editable numeric input (`min="1"`).
  - **Unit Rate (₹)**: Editable numeric input (`step="0.01"`).
  - **Total (₹)**: Auto-calculated `(quantity * unitPrice)`.
  - **Actions**: Remove item button (if > 1 item).
- An **Add Custom Item** button remains available to append additional fabrication lines if needed.
- Live recalculation of Order Total Amount whenever any quantity or rate is adjusted.

### 3. Mode of Payment Dropdown
- Added in the order header form next to Delivery Address or Customer info:
  ```jsx
  <div>
    <label className="block text-xs font-semibold text-steel-700 mb-1">
      Mode of Payment *
    </label>
    <select
      value={formData.paymentMode}
      onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
      className="w-full px-2.5 py-1.5 rounded-md border border-steel-300 text-steel-900 bg-white"
    >
      <option value="CASH">Cash</option>
      <option value="ONLINE">NEFT / UPI / Card</option>
    </select>
  </div>
  ```

### 4. Order Editing Workflow & Status Guardrail
- **Payment Status & Mode Updatability**:
  - Payment status (`UNPAID`, `PARTIAL`, `PAID`) and payment mode (`CASH`, `ONLINE`) are always editable so users can record payments as they are collected (including on-delivery or post-delivery payments).
  - In the Edit Modal, users can switch payment status between `Unpaid`, `Partial`, and `Paid in Full`, and update payment mode accordingly.
- **Status Guardrail Nuance**:
  - Orders marked `DELIVERED` or `CANCELLED` have their fabrication specifications, dimensions, quantities, and rates locked to prevent altering already fabricated/delivered goods.
  - However, updating the **Payment Status** (e.g. marking a delivered order as "Paid in Full") and **Payment Mode** is always permitted.
- In the `SalesView` table:
  - Add an **Actions** column with an **Edit** button (`<Edit3 className="w-3.5 h-3.5" />`).
  - For `DELIVERED` orders, the modal permits updating payment status, payment mode, and delivery notes while locking item specifications.
  - For `CANCELLED` orders, editing is disabled.
  - Clicking **Edit** opens the modal in Edit Mode (`editingSaleOrder !== null`):
    - Modal title: `"Edit Sales Order — SO-XXXXXX"`
    - Pre-populates all existing values: `customerId`, `quotationId`, `paymentMode`, `paymentStatus`, `status`, `deliveryAddress`, and `items`.
    - Form submission calls `api.updateSale(editingSaleOrder.id, payload)` and refreshes the list upon success.
- Display `paymentMode` and `paymentStatus` in the orders table:
  - Add a dedicated column or badge in the table showing **Mode of Payment** (`Cash` or `NEFT / UPI / Card`).
  - Interactive or clearly editable payment status so users can easily record when payment is completed.

---

## Code Style & Implementation Conventions
- Follow existing glass takeoff naming conventions and clean Tailwind styling (`steel-*`, `edge-*`, `font-mono` for numbers, `text-xs`).
- Currency formatted with `toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`.
- Preserve existing comments and docstrings.
- Graceful in-memory fallback for backend controllers when database is unavailable.

---

## Testing Strategy
- **API Tests**:
  - Test `GET /api/sales`: Returns list with `paymentMode`.
  - Test `POST /api/sales`: Successfully creates an order with `paymentMode` (`ONLINE` or `CASH`) and items.
  - Test `PUT /api/sales/:id`: Successfully updates `paymentMode`, delivery address, items, and recalculates `totalAmount`.
  - Test database fallback: Controller handles queries cleanly if database connection drops.
- **Frontend Verification**:
  - Run `npm run build:frontend` to ensure zero compilation or JSX syntax errors.
  - Test UI flow:
    1. Click "New Sale Order" -> Modal opens.
    2. Select an Invoice from dropdown -> Customer auto-selects, glass line items auto-populate with quantities and rates.
    3. Change Mode of Payment to "Online" or "Cash".
    4. Edit an item's quantity or rate -> Total amount updates in real-time.
    5. Save order -> Order appears in the table with correct payment mode and total.
    6. Click "Edit" on the created order -> Modal opens prefilled with order details.
    7. Change payment mode, address, or items -> Save -> Changes reflected in table immediately.

---

## Boundaries
- **Always do**:
  - Validate numeric values (`quantity >= 1`, `unitPrice >= 0`) before recalculating totals.
  - Ensure `totalAmount` is calculated server-side from items to prevent stale totals.
  - Maintain backward compatibility for existing sales orders where `paymentMode` may be null or undefined (default to `'CASH'`).
- **Ask first**:
  - Dropping or modifying any existing columns in `sale_orders` or `sale_order_items`.
  - Changing customer or quotation tables.
- **Never do**:
  - Break existing quotation-to-sales linkages.
  - Remove in-memory fallback support in controllers.
  - Commit untested code that fails `npm run build:frontend`.

---

## Success Criteria
- [ ] `SaleOrder` model and database schema include `paymentMode` (`ONLINE` / `CASH`, default `'CASH'`).
- [ ] Mode of Payment dropdown (`Online` / `Cash`) is present in the Sales Order modal and persists correctly.
- [ ] Sales Orders table displays the Mode of Payment for each order.
- [ ] Manual product SKU selection is removed from the sales order modal; choosing an Invoice auto-populates customer and all item specifications, cut dimensions, quantities, and prices.
- [ ] Sales line items are fully editable (quantities, unit prices, descriptions) with automatic real-time total recalculation.
- [ ] Sales orders can be edited via an Edit action button in the table and saved via `PUT /api/sales/:id`.
- [ ] Production build (`npm run build:frontend`) passes with 0 errors.

---

## Resolved Decisions
1. **Direct Orders (Without Invoice)**: Supported alongside invoice-based orders. If no invoice is selected, users can pick a customer and directly enter custom item descriptions, quantities, and rates. When an invoice is selected, customer and all invoice line items are auto-populated.
2. **Order Status Restrictions & Payment Updatability**: When an order is `DELIVERED`, fabrication items (dimensions, quantities, rates) are locked to maintain audit accuracy, but users can always edit and update the **Payment Status** (e.g. marking as "Paid in Full") and **Payment Mode** when payment is received. Completely cancelled orders (`CANCELLED`) are locked.
3. **Mode of Payment Labels**: Configured as **Cash** (`CASH`) and **NEFT / UPI / Card** (`ONLINE`).
