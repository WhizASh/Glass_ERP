/**
 * VitroGlass ERP Centralized API Service.
 * Attempts to call the Node.js / Express backend endpoints via Vite proxy (/api).
 * Falls back transparently to realistic in-memory / localStorage mock data
 * so the system is fully functional offline and online.
 */

// Initial Mock Data
const INITIAL_SUPPLIERS = [
  {
    id: 'sup-1',
    name: 'Saint-Gobain Glass Corp',
    contactPerson: 'Marcus Vance',
    email: 'm.vance@saint-gobain.mock',
    phone: '+1 (555) 234-5678',
    taxId: 'US-SG-994821',
    address: '100 Industrial Blvd, Valley Forge, PA',
  },
  {
    id: 'sup-2',
    name: 'AGC Flat Glass International',
    contactPerson: 'Elena Rostova',
    email: 'e.rostova@agc-glass.mock',
    phone: '+1 (555) 876-5432',
    taxId: 'US-AGC-332901',
    address: '45 Float Way, Kingsport, TN',
  },
  {
    id: 'sup-3',
    name: 'Saflex Interlayer Materials (Eastman)',
    contactPerson: 'David Chen',
    email: 'dchen@eastman-saflex.mock',
    phone: '+1 (555) 432-1098',
    taxId: 'US-SFX-771239',
    address: '200 Chemical Park, Springfield, MA',
  },
  {
    id: 'sup-4',
    name: 'Dow Performance Silicones',
    contactPerson: 'Sarah Jenkins',
    email: 's.jenkins@dow-silicones.mock',
    phone: '+1 (555) 654-3210',
    taxId: 'US-DOW-119842',
    address: '2211 Dow Center, Midland, MI',
  },
];

const INITIAL_CUSTOMERS = [
  {
    id: 'cust-1',
    type: 'ORGANIZATION',
    name: 'Skyline Architectural Facades',
    companyName: 'Skyline Architectural Facades Inc.',
    gstin: 'GST-US-8849201',
    email: 'procurement@skylinefacades.mock',
    phone: '+1 (555) 301-4499',
    billingAddress: '400 Commercial Ave, Suite 1200, Chicago, IL',
    shippingAddress: 'Tower Site B, 55 Michigan Ave, Chicago, IL',
  },
  {
    id: 'cust-2',
    type: 'ORGANIZATION',
    name: 'Apex Balustrades & Railings',
    companyName: 'Apex Structural Glass LLC',
    gstin: 'GST-US-4491028',
    email: 'orders@apexbalustrades.mock',
    phone: '+1 (555) 412-8822',
    billingAddress: '780 Fabricator Rd, Detroit, MI',
    shippingAddress: '780 Fabricator Rd, Detroit, MI',
  },
  {
    id: 'cust-3',
    type: 'INDIVIDUAL',
    name: 'Robert Henderson',
    companyName: null,
    gstin: null,
    email: 'robert.henderson@email.mock',
    phone: '+1 (555) 902-1144',
    billingAddress: '142 Maplewood Drive, Naperville, IL',
    shippingAddress: '142 Maplewood Drive, Naperville, IL',
  },
  {
    id: 'cust-4',
    type: 'ORGANIZATION',
    name: 'Zenith Shower Doors & Partitions',
    companyName: 'Zenith Interiors Ltd',
    gstin: 'GST-US-5519823',
    email: 'info@zenithinteriors.mock',
    phone: '+1 (555) 789-2231',
    billingAddress: '12 Glassworks Way, Milwaukee, WI',
    shippingAddress: '12 Glassworks Way, Milwaukee, WI',
  },
];

const INITIAL_INVENTORY = [
  {
    id: 'inv-1',
    sku: 'FLT-CLR-06-3222',
    name: 'Clear Float Glass Sheet 6mm (3210 × 2250 mm)',
    category: 'FLOAT_SHEET',
    glassType: 'ANNEALED_FLOAT',
    thicknessMm: 6,
    widthMm: 3210,
    heightMm: 2250,
    stockQuantity: 42,
    unitOfMeasure: 'Sheets',
    reorderLevel: 15,
    unitCost: 145.0,
    unitPrice: 225.0,
    rackLocation: 'Rack A-01',
  },
  {
    id: 'inv-2',
    sku: 'FLT-CLR-10-3222',
    name: 'Clear Float Glass Sheet 10mm (3210 × 2250 mm)',
    category: 'FLOAT_SHEET',
    glassType: 'ANNEALED_FLOAT',
    thicknessMm: 10,
    widthMm: 3210,
    heightMm: 2250,
    stockQuantity: 18,
    unitOfMeasure: 'Sheets',
    reorderLevel: 10,
    unitCost: 260.0,
    unitPrice: 390.0,
    rackLocation: 'Rack A-03',
  },
  {
    id: 'inv-3',
    sku: 'FLT-CLR-12-3222',
    name: 'Clear Float Glass Sheet 12mm (3210 × 2250 mm)',
    category: 'FLOAT_SHEET',
    glassType: 'ANNEALED_FLOAT',
    thicknessMm: 12,
    widthMm: 3210,
    heightMm: 2250,
    stockQuantity: 6,
    unitOfMeasure: 'Sheets',
    reorderLevel: 8,
    unitCost: 320.0,
    unitPrice: 480.0,
    rackLocation: 'Rack A-05',
  },
  {
    id: 'inv-4',
    sku: 'FLT-LOWE-06-3222',
    name: 'Low-E Coated Solar Control 6mm (3210 × 2250 mm)',
    category: 'FLOAT_SHEET',
    glassType: 'LOW_E',
    thicknessMm: 6,
    widthMm: 3210,
    heightMm: 2250,
    stockQuantity: 24,
    unitOfMeasure: 'Sheets',
    reorderLevel: 10,
    unitCost: 310.0,
    unitPrice: 475.0,
    rackLocation: 'Rack B-02',
  },
  {
    id: 'inv-5',
    sku: 'RAW-PVB-076-200',
    name: 'PVB Interlayer Film Roll 0.76mm (2.1m × 200m)',
    category: 'RAW_MATERIAL',
    glassType: null,
    thicknessMm: 0.76,
    widthMm: 2100,
    heightMm: null,
    stockQuantity: 8,
    unitOfMeasure: 'Packs',
    reorderLevel: 3,
    unitCost: 890.0,
    unitPrice: 1250.0,
    rackLocation: 'Cleanroom Storage C-1',
  },
  {
    id: 'inv-6',
    sku: 'CON-SLNT-DOW995',
    name: 'DOWSIL 995 Structural Silicone Sealant (600ml sausage)',
    category: 'CONSUMABLE',
    glassType: null,
    thicknessMm: null,
    widthMm: null,
    heightMm: null,
    stockQuantity: 120,
    unitOfMeasure: 'Units',
    reorderLevel: 30,
    unitCost: 18.5,
    unitPrice: 28.0,
    rackLocation: 'Chemical Cabinet D-3',
  },
  {
    id: 'inv-7',
    sku: 'HDW-SPACER-16MM',
    name: 'Warm-Edge Aluminum Spacer Bar 16mm (6m length)',
    category: 'HARDWARE_FITTINGS',
    glassType: null,
    thicknessMm: 16,
    widthMm: null,
    heightMm: null,
    stockQuantity: 140,
    unitOfMeasure: 'Units',
    reorderLevel: 50,
    unitCost: 9.2,
    unitPrice: 15.0,
    rackLocation: 'Hardware Bay E-2',
  },
  {
    id: 'inv-8',
    sku: 'FIN-TEM-12-BAL',
    name: 'Stock Toughened Balustrade Panels 12mm (1200 × 1000 mm)',
    category: 'FINISHED_GLASS',
    glassType: 'TOUGHENED_TEMPERED',
    thicknessMm: 12,
    widthMm: 1200,
    heightMm: 1000,
    stockQuantity: 15,
    unitOfMeasure: 'Sheets',
    reorderLevel: 5,
    unitCost: 95.0,
    unitPrice: 165.0,
    rackLocation: 'Crate Zone F-1',
  },
];

const INITIAL_PURCHASES = [
  {
    id: 'po-101',
    orderNumber: 'PO-2026-089',
    supplierId: 'sup-1',
    supplierName: 'Saint-Gobain Glass Corp',
    totalAmount: 14500.0,
    status: 'COMPLETED',
    purchaseDate: '2026-11-01T10:15:00Z',
    notes: 'Bulk autumn delivery of 6mm and 10mm clear float packs.',
    items: [
      { id: 'poi-1', itemId: 'inv-1', itemName: 'Clear Float Glass Sheet 6mm', quantity: 50, unitCost: 145.0, totalCost: 7250.0 },
      { id: 'poi-2', itemId: 'inv-2', itemName: 'Clear Float Glass Sheet 10mm', quantity: 25, unitCost: 290.0, totalCost: 7250.0 },
    ],
  },
  {
    id: 'po-102',
    orderNumber: 'PO-2026-090',
    supplierId: 'sup-3',
    supplierName: 'Saflex Interlayer Materials (Eastman)',
    totalAmount: 5340.0,
    status: 'COMPLETED',
    purchaseDate: '2026-11-03T14:30:00Z',
    notes: 'Saflex Clear & Acoustic PVB rolls for laminated architectural run.',
    items: [
      { id: 'poi-3', itemId: 'inv-5', itemName: 'PVB Interlayer Film Roll 0.76mm', quantity: 6, unitCost: 890.0, totalCost: 5340.0 },
    ],
  },
  {
    id: 'po-103',
    orderNumber: 'PO-2026-091',
    supplierId: 'sup-4',
    supplierName: 'Dow Performance Silicones',
    totalAmount: 2220.0,
    status: 'COMPLETED',
    purchaseDate: '2026-11-04T09:00:00Z',
    notes: 'Structural glazed sealant cartridges and primer.',
    items: [
      { id: 'poi-4', itemId: 'inv-6', itemName: 'DOWSIL 995 Structural Silicone', quantity: 120, unitCost: 18.5, totalCost: 2220.0 },
    ],
  },
];

const INITIAL_QUOTATIONS = [
  {
    id: 'qt-201',
    quotationNumber: 'QT-2026-048',
    customerId: 'cust-1',
    customerName: 'Skyline Architectural Facades',
    customerType: 'ORGANIZATION',
    subtotal: 18450.0,
    taxAmount: 1845.0,
    discountAmount: 500.0,
    totalAmount: 19795.0,
    status: 'CONFIRMED',
    validUntil: '2026-12-01T23:59:59Z',
    notes: 'Facade panels for Michigan Ave atrium renovation. Ground and polished edges with 4 CNC mounting holes per pane.',
    createdAt: '2026-11-02T11:20:00Z',
    items: [
      {
        id: 'qti-1',
        glassType: 'TOUGHENED_TEMPERED',
        thicknessMm: 12,
        widthMm: 2400,
        heightMm: 1500,
        areaSqM: 3.6,
        quantity: 20,
        edgeWork: 'FLAT_POLISH',
        holesCount: 4,
        unitPrice: 620.0,
        lineTotal: 12400.0,
      },
      {
        id: 'qti-2',
        glassType: 'LOW_E',
        thicknessMm: 6,
        widthMm: 2400,
        heightMm: 1500,
        areaSqM: 3.6,
        quantity: 15,
        edgeWork: 'SEAMED_ARRIS',
        holesCount: 0,
        unitPrice: 403.33,
        lineTotal: 6050.0,
      },
    ],
  },
  {
    id: 'qt-202',
    quotationNumber: 'QT-2026-049',
    customerId: 'cust-2',
    customerName: 'Apex Balustrades & Railings',
    customerType: 'ORGANIZATION',
    subtotal: 7280.0,
    taxAmount: 728.0,
    discountAmount: 0.0,
    totalAmount: 8008.0,
    status: 'COMPLETED',
    validUntil: '2026-11-28T23:59:59Z',
    notes: 'Clear laminated balustrade panels for hotel mezzanine.',
    createdAt: '2026-11-03T16:45:00Z',
    items: [
      {
        id: 'qti-3',
        glassType: 'LAMINATED',
        thicknessMm: 10,
        widthMm: 1800,
        heightMm: 1100,
        areaSqM: 1.98,
        quantity: 16,
        edgeWork: 'PENCIL_POLISH',
        holesCount: 2,
        unitPrice: 455.0,
        lineTotal: 7280.0,
      },
    ],
  },
  {
    id: 'qt-203',
    quotationNumber: 'QT-2026-050',
    customerId: 'cust-3',
    customerName: 'Robert Henderson',
    customerType: 'INDIVIDUAL',
    subtotal: 1240.0,
    taxAmount: 124.0,
    discountAmount: 50.0,
    totalAmount: 1314.0,
    status: 'DRAFT',
    validUntil: '2026-11-20T23:59:59Z',
    notes: 'Custom frameless shower partition and acid-etched privacy panel.',
    createdAt: '2026-11-04T15:10:00Z',
    items: [
      {
        id: 'qti-4',
        glassType: 'TOUGHENED_TEMPERED',
        thicknessMm: 10,
        widthMm: 2000,
        heightMm: 900,
        areaSqM: 1.8,
        quantity: 2,
        edgeWork: 'FLAT_POLISH',
        holesCount: 2,
        unitPrice: 410.0,
        lineTotal: 820.0,
      },
      {
        id: 'qti-5',
        glassType: 'FROSTED_ACID_ETCHED',
        thicknessMm: 8,
        widthMm: 1500,
        heightMm: 700,
        areaSqM: 1.05,
        quantity: 2,
        edgeWork: 'SEAMED_ARRIS',
        holesCount: 0,
        unitPrice: 210.0,
        lineTotal: 420.0,
      },
    ],
  },
];

// Local state helpers with persistence
function loadState(key, fallback) {
  try {
    const saved = localStorage.getItem(`vitro_${key}`);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveState(key, data) {
  try {
    localStorage.setItem(`vitro_${key}`, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

// In-memory / localStorage cache
let suppliers = loadState('suppliers', INITIAL_SUPPLIERS);
let customers = loadState('customers', INITIAL_CUSTOMERS);
let inventory = loadState('inventory', INITIAL_INVENTORY);
let purchases = loadState('purchases', INITIAL_PURCHASES);
let quotations = loadState('quotations', INITIAL_QUOTATIONS);

const RAW_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim();

function getFullUrl(path) {
  if (!RAW_BASE_URL) return path;
  const base = RAW_BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (base.endsWith('/api') && cleanPath.startsWith('/api')) {
    return `${base}${cleanPath.slice(4)}`;
  }
  return `${base}${cleanPath}`;
}

/**
 * Helper to make network requests with immediate fallback on failure
 */
async function fetchWithFallback(path, options = {}, fallbackFn) {
  try {
    const fullUrl = getFullUrl(path);
    const res = await fetch(fullUrl, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (res.ok) {
      const json = await res.json();
      if (json && typeof json === 'object' && json.success === true && 'data' in json) {
        return json.data;
      }
      return json;
    }
  } catch (err) {
    // Backend offline or unreachable - use fallbackFn seamlessly
  }
  return fallbackFn();
}

export const api = {
  // ================= DASHBOARD =================
  async getDashboardSummary() {
    return fetchWithFallback('/api/dashboard/summary', { method: 'GET' }, () => {
      const totalRevenue = quotations
        .filter((q) => q.status === 'COMPLETED' || q.status === 'CONFIRMED')
        .reduce((sum, q) => sum + q.totalAmount, 0);

      const activeQuotesCount = quotations.filter((q) => q.status === 'DRAFT' || q.status === 'CONFIRMED').length;

      const monthlyPurchasesTotal = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

      const lowStockCount = inventory.filter((item) => item.stockQuantity <= item.reorderLevel).length;

      return {
        totalRevenue,
        activeQuotesCount,
        monthlyPurchasesTotal,
        lowStockCount,
      };
    });
  },

  async getSalesChart(period = 'month') {
    return fetchWithFallback(`/api/dashboard/sales-chart?period=${period}`, { method: 'GET' }, () => {
      if (period === 'week') {
        return [
          { label: 'Mon', revenue: 4200, volumeM2: 72 },
          { label: 'Tue', revenue: 6800, volumeM2: 110 },
          { label: 'Wed', revenue: 8400, volumeM2: 135 },
          { label: 'Thu', revenue: 5100, volumeM2: 88 },
          { label: 'Fri', revenue: 9900, volumeM2: 160 },
          { label: 'Sat', revenue: 3200, volumeM2: 50 },
          { label: 'Sun', revenue: 1100, volumeM2: 18 },
        ];
      }
      if (period === 'year') {
        return [
          { label: 'Jan', revenue: 38000, volumeM2: 620 },
          { label: 'Feb', revenue: 45000, volumeM2: 710 },
          { label: 'Mar', revenue: 58000, volumeM2: 940 },
          { label: 'Apr', revenue: 52000, volumeM2: 830 },
          { label: 'May', revenue: 64000, volumeM2: 1020 },
          { label: 'Jun', revenue: 71000, volumeM2: 1150 },
          { label: 'Jul', revenue: 68000, volumeM2: 1090 },
          { label: 'Aug', revenue: 79000, volumeM2: 1280 },
          { label: 'Sep', revenue: 85000, volumeM2: 1390 },
          { label: 'Oct', revenue: 92000, volumeM2: 1470 },
          { label: 'Nov', revenue: 29117, volumeM2: 480 },
        ];
      }
      // Default: Month (weekly blocks)
      return [
        { label: 'Oct Wk 2', revenue: 18200, volumeM2: 290 },
        { label: 'Oct Wk 3', revenue: 22400, volumeM2: 360 },
        { label: 'Oct Wk 4', revenue: 26800, volumeM2: 430 },
        { label: 'Nov Wk 1', revenue: 29117, volumeM2: 468 },
      ];
    });
  },

  async getTopProduce() {
    return fetchWithFallback('/api/dashboard/top-produce', { method: 'GET' }, () => {
      return [
        { name: '12mm Toughened Clear', category: 'Architectural Glazing', areaM2: 584.2, ordersCount: 42, percentage: 38 },
        { name: '8mm Clear Float Sheets', category: 'Raw Processing', areaM2: 392.5, ordersCount: 29, percentage: 26 },
        { name: '10mm Laminated Safety Glass', category: 'Balustrades & Partitions', areaM2: 275.8, ordersCount: 21, percentage: 18 },
        { name: '6mm Low-E Solar Control', category: 'Facade Units', areaM2: 198.4, ordersCount: 15, percentage: 13 },
        { name: '10mm Frosted Acid Etched', category: 'Interior Privacy', areaM2: 76.5, ordersCount: 8, percentage: 5 },
      ];
    });
  },

  async getRecentActivity() {
    return fetchWithFallback('/api/dashboard/recent-activity', { method: 'GET' }, () => {
      return {
        recentQuotations: quotations.slice(0, 5),
        recentPurchases: purchases.slice(0, 5),
      };
    });
  },

  // ================= INVENTORY =================
  async getInventory(category) {
    return fetchWithFallback(`/api/inventory${category ? `?category=${category}` : ''}`, { method: 'GET' }, () => {
      if (!category || category === 'ALL') return [...inventory];
      return inventory.filter((item) => item.category === category);
    });
  },

  async createInventoryItem(itemData) {
    return fetchWithFallback(
      '/api/inventory',
      { method: 'POST', body: JSON.stringify(itemData) },
      () => {
        const newItem = {
          id: `inv-${Date.now()}`,
          sku: itemData.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          stockQuantity: Number(itemData.stockQuantity) || 0,
          reorderLevel: Number(itemData.reorderLevel) || 10,
          unitCost: Number(itemData.unitCost) || 0,
          unitPrice: Number(itemData.unitPrice) || 0,
          thicknessMm: itemData.thicknessMm ? Number(itemData.thicknessMm) : null,
          widthMm: itemData.widthMm ? Number(itemData.widthMm) : null,
          heightMm: itemData.heightMm ? Number(itemData.heightMm) : null,
          ...itemData,
        };
        inventory = [newItem, ...inventory];
        saveState('inventory', inventory);
        return newItem;
      }
    );
  },

  async updateInventoryItem(id, itemData) {
    return fetchWithFallback(
      `/api/inventory/${id}`,
      { method: 'PUT', body: JSON.stringify(itemData) },
      () => {
        inventory = inventory.map((item) => (item.id === id ? { ...item, ...itemData } : item));
        saveState('inventory', inventory);
        return inventory.find((item) => item.id === id);
      }
    );
  },

  async adjustStock(id, { quantity, reason, notes }) {
    return fetchWithFallback(
      `/api/inventory/${id}/adjust`,
      { method: 'POST', body: JSON.stringify({ quantity, reason, notes }) },
      () => {
        inventory = inventory.map((item) => {
          if (item.id === id) {
            const updatedStock = Math.max(0, item.stockQuantity + Number(quantity));
            return { ...item, stockQuantity: updatedStock };
          }
          return item;
        });
        saveState('inventory', inventory);
        return inventory.find((item) => item.id === id);
      }
    );
  },

  // ================= PURCHASES =================
  async getPurchases() {
    return fetchWithFallback('/api/purchases', { method: 'GET' }, () => {
      return [...purchases];
    });
  },

  async createPurchase(purchaseData) {
    return fetchWithFallback(
      '/api/purchases',
      { method: 'POST', body: JSON.stringify(purchaseData) },
      () => {
        const supplier = suppliers.find((s) => s.id === purchaseData.supplierId);
        const orderNumber = `PO-${new Date().getFullYear()}-${String(purchases.length + 92).padStart(3, '0')}`;
        const newPurchase = {
          id: `po-${Date.now()}`,
          orderNumber,
          supplierId: purchaseData.supplierId,
          supplierName: supplier ? supplier.name : purchaseData.supplierName || 'General Supplier',
          totalAmount: Number(purchaseData.totalAmount) || 0,
          status: 'COMPLETED',
          purchaseDate: new Date().toISOString(),
          notes: purchaseData.notes || '',
          items: purchaseData.items || [],
        };
        purchases = [newPurchase, ...purchases];
        saveState('purchases', purchases);

        // Update inventory stock quantities automatically
        if (purchaseData.items && purchaseData.items.length > 0) {
          purchaseData.items.forEach((pItem) => {
            if (pItem.itemId) {
              const invIdx = inventory.findIndex((i) => i.id === pItem.itemId);
              if (invIdx !== -1) {
                inventory[invIdx].stockQuantity += Number(pItem.quantity);
              }
            }
          });
          saveState('inventory', inventory);
        }

        return newPurchase;
      }
    );
  },

  // ================= SUPPLIERS =================
  async getSuppliers() {
    return fetchWithFallback('/api/suppliers', { method: 'GET' }, () => {
      return [...suppliers];
    });
  },

  async createSupplier(supplierData) {
    return fetchWithFallback(
      '/api/suppliers',
      { method: 'POST', body: JSON.stringify(supplierData) },
      () => {
        const newSupplier = {
          id: `sup-${Date.now()}`,
          ...supplierData,
        };
        suppliers = [...suppliers, newSupplier];
        saveState('suppliers', suppliers);
        return newSupplier;
      }
    );
  },

  // ================= QUOTATIONS =================
  async getQuotations() {
    return fetchWithFallback('/api/quotations', { method: 'GET' }, () => {
      return [...quotations];
    });
  },

  async createQuotation(quoteData) {
    return fetchWithFallback(
      '/api/quotations',
      { method: 'POST', body: JSON.stringify(quoteData) },
      () => {
        const customer = customers.find((c) => c.id === quoteData.customerId);
        const quotationNumber = `QT-${new Date().getFullYear()}-${String(quotations.length + 51).padStart(3, '0')}`;
        const newQuote = {
          id: `qt-${Date.now()}`,
          quotationNumber,
          customerId: quoteData.customerId,
          customerName: customer ? customer.name : quoteData.customerName || 'Direct Client',
          customerType: customer ? customer.type : quoteData.customerType || 'INDIVIDUAL',
          subtotal: Number(quoteData.subtotal) || 0,
          taxAmount: Number(quoteData.taxAmount) || 0,
          discountAmount: Number(quoteData.discountAmount) || 0,
          totalAmount: Number(quoteData.totalAmount) || 0,
          status: quoteData.status || 'DRAFT',
          validUntil: quoteData.validUntil || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
          notes: quoteData.notes || '',
          createdAt: new Date().toISOString(),
          items: quoteData.items || [],
        };
        quotations = [newQuote, ...quotations];
        saveState('quotations', quotations);
        return newQuote;
      }
    );
  },

  async updateQuotationStatus(id, status) {
    return fetchWithFallback(
      `/api/quotations/${id}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      () => {
        quotations = quotations.map((q) => (q.id === id ? { ...q, status } : q));
        saveState('quotations', quotations);
        return quotations.find((q) => q.id === id);
      }
    );
  },

  // ================= CUSTOMERS =================
  async getCustomers() {
    return fetchWithFallback('/api/customers', { method: 'GET' }, () => {
      return [...customers];
    });
  },

  async createCustomer(customerData) {
    return fetchWithFallback(
      '/api/customers',
      { method: 'POST', body: JSON.stringify(customerData) },
      () => {
        const newCustomer = {
          id: `cust-${Date.now()}`,
          type: customerData.type || 'INDIVIDUAL',
          name: customerData.name,
          companyName: customerData.type === 'ORGANIZATION' ? customerData.companyName : null,
          gstin: customerData.type === 'ORGANIZATION' ? customerData.gstin : null,
          email: customerData.email,
          phone: customerData.phone,
          billingAddress: customerData.billingAddress,
          shippingAddress: customerData.shippingAddress || customerData.billingAddress,
        };
        customers = [...customers, newCustomer];
        saveState('customers', customers);
        return newCustomer;
      }
    );
  },
};
