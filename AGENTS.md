# AGENTS.md — VitroGlass ERP Repository Rules & Context Guide

Rules and persistent context for AI agents working in this repository. Follow these guidelines on every task.

---

## 1. Tech Stack

- **Frontend:** React 18, Vite 6, Tailwind CSS 3.4, Lucide React (icons), Recharts (charts).
- **Backend:** Node.js, Express 4 REST API.
- **Database & ORM:** PostgreSQL, Prisma ORM 6 (with transparent in-memory mock store fallback when PostgreSQL is offline).
- **Architecture:** Client-Server decoupled monorepo (`frontend/` and `backend/`).

Do not introduce other frontend frameworks, ORMs, or databases.

---

## 2. Essential Commands

| Action | Command |
|---|---|
| Frontend Dev Server | `npm --prefix frontend run dev` |
| Frontend Production Build | `npm --prefix frontend run build` |
| Backend Dev Server | `npm --prefix backend run dev` |
| Backend Production Start | `npm --prefix backend start` |
| Run All Backend Tests | `npm --prefix backend test` |
| Prisma Migrate (New DB Change) | `npm --prefix backend run prisma:migrate` |
| Prisma DB Push (Dev Prototype) | `npm --prefix backend run prisma:push` |
| Seed Demo Database | `npm --prefix backend run seed` |

---

## 3. Architecture & Code Conventions

### Modularity & File Size
- **One Component, One File:** Every new component, modal, or widget goes into its own dedicated file.
- **Small & Focused:** Keep components under ~250 lines. Split complex modals or calculators into subcomponents.
- **Named & Default Exports:** Use standard, clear export conventions.
- **No Class Components:** Use functional React components with modern hooks.

### Database Migrations & Persistence
- Every schema change in `backend/prisma/schema.prisma` requires a **new migration file** in `backend/migrations/`.
- **Never edit an existing migration file.** Always create a new sequential migration.
- `backend/src/config/db.js` implements a resilient fallback store (`mockStore`) so backend endpoints and unit tests run even if PostgreSQL is not active locally.

### Resilient API & Offline Mock
- The frontend uses `frontend/src/services/api.js` to query `/api/*`.
- If the backend is unreachable, `api.js` transparently falls back to localStorage mock data so UI development and testing never break.
- Both backend seed data and frontend mock data use localized Indian business data (Names, +91 phone numbers, 15-char GSTINs, addresses, and IS 2553 quality standards).

---

## 4. Domain & Precision Math Rules (Glass Manufacturing)

When calculating or validating glass fabrication specifications:

1. **Surface Area ($m^2$):**
   $$\text{Area} = \frac{\text{Width (mm)} \times \text{Height (mm)}}{1,000,000}$$
2. **Perimeter ($m$):**
   $$\text{Perimeter} = \frac{2 \times (\text{Width (mm)} + \text{Height (mm)})}{1,000}$$
3. **Weight ($kg$):**
   Standard glass density is $2500\,\text{kg/m}^3$ (i.e. $2.5\,\text{kg}$ per $m^2$ per mm thickness):
   $$\text{Weight} = \text{Area} \times \text{Thickness (mm)} \times 2.5$$
4. **Line Item Cost Formula:**
   $$\text{Line Total} = \left[(\text{Base Rate} \times \text{Area}) + (\text{Edge Polish Rate} \times \text{Perimeter}) + (\text{Hole Rate} \times \text{Holes Count})\right] \times \text{Quantity}$$
5. **Quality Standard:** Architectural tempered / toughened glass complies with **IS 2553 (Part 1)**.

---

## 5. Hierarchical Project Index (Level 2/3 Context)

```
ERP/
├── backend/
│   ├── prisma/schema.prisma         # Data models: Customer, Supplier, InventoryItem, Quotation, PurchaseOrder, StockMovement
│   ├── migrations/                  # Sequential database migrations
│   ├── scripts/                     # seed.js, test-backend.js, test-api.js
│   └── src/
│       ├── config/db.js             # Dual-mode DB provider (Prisma Client + fallback mockStore)
│       ├── config/initialData.js    # Seed data (Indian names, GSTINs, catalog items)
│       ├── controllers/             # Express request handlers
│       ├── services/                # Business logic & calculations (glassCalculationService, dashboardService, etc.)
│       └── routes/                  # Express route routers mounted on /api
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Button, Input, Modal, Select, Table, Badge
│   │   │   ├── layout/              # Header, Sidebar, Layout
│   │   │   ├── dashboard/           # MetricCards, SalesChart, RecentSalesTable, RecentPurchasesFeed, TopProduceWidget, QuickLinks
│   │   │   ├── quotation/           # QuotationView, GlassItemCalculator, CustomerSelector, QuotationSummary, QuotationList, QuotationDetailModal
│   │   │   ├── purchase/            # PurchaseView, PurchaseFormModal, SupplierSelect, PurchaseTable
│   │   │   ├── inventory/           # InventoryView, AddEditItemModal, StockAdjustmentModal, InventoryTable, InventoryFilters
│   │   │   └── customers/           # CustomerView, CustomerFormModal, CustomerList
│   │   ├── services/api.js          # Centralized API service with localStorage fallback
│   │   └── utils/                   # glassMath.js, formatters.js
│   └── index.html
└── spec/
    └── 00_intial_spec_plan.md       # Product requirements & architecture specification
```

---

## 6. Context Budget & Verification Checklist

Before ending any task turn or committing changes:
- [ ] Run `npm --prefix frontend run build` to verify no JSX or bundle errors.
- [ ] Run `npm --prefix backend test` to verify service logic and REST endpoints pass.
- [ ] Ensure any newly added inputs or mock values follow localized Indian conventions (+91 phones, 15-char GSTINs, INR context).
- [ ] Never load unnecessary bundle files or full logs into the context window; summarize errors concisely.
