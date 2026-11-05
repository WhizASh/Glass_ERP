// Sample initial data for Glass Production Facility ERP

const initialCustomers = [
  {
    id: "cust-001",
    type: "ORGANIZATION",
    name: "Apex Glass & Façades Ltd",
    companyName: "Apex Glass & Façades Ltd",
    gstin: "27AABCA1234F1Z9",
    email: "procurement@apexglass.com",
    phone: "+91 98201 11223",
    billingAddress: "401 Skylark Tower, Senapati Bapat Marg, Lower Parel, Mumbai 400013",
    shippingAddress: "Site 4B, Mindspace Business Park, Airoli, Navi Mumbai 400708",
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: "cust-002",
    type: "ORGANIZATION",
    name: "Rajesh Architectural Systems",
    companyName: "Rajesh Architectural Systems Pvt Ltd",
    gstin: "29AAACR5678M1Z2",
    email: "info@rajesharc.in",
    phone: "+91 98450 33445",
    billingAddress: "88 Industrial Suburb, Peenya 2nd Stage, Bangalore 560058",
    shippingAddress: "Prestige Tech Park Glazing Site, Marathahalli, Bangalore 560103",
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: "cust-003",
    type: "INDIVIDUAL",
    name: "Vikram Sharma",
    companyName: null,
    gstin: null,
    email: "vikram.sharma99@gmail.com",
    phone: "+91 98110 55667",
    billingAddress: "Villa 14, Palm Avenue, Bandra West, Mumbai 400050",
    shippingAddress: "Villa 14, Palm Avenue, Bandra West, Mumbai 400050",
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: "cust-004",
    type: "INDIVIDUAL",
    name: "Priya Nair",
    companyName: null,
    gstin: null,
    email: "priya.nair@outlook.com",
    phone: "+91 97401 77889",
    billingAddress: "Apartment 702, Sobha Iris, Outer Ring Road, Bangalore 560103",
    shippingAddress: "Apartment 702, Sobha Iris, Outer Ring Road, Bangalore 560103",
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: "cust-005",
    type: "ORGANIZATION",
    name: "Moderne Interiors LLP",
    companyName: "Moderne Interiors LLP",
    gstin: "07AABCM9876P1ZV",
    email: "design@moderneinteriors.com",
    phone: "+91 98100 88990",
    billingAddress: "Sector 18, Udyog Vihar, Gurgaon 122015",
    shippingAddress: "DLF Cybercity Phase 3, Gurgaon 122002",
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

const initialSuppliers = [
  {
    id: "supp-001",
    name: "Saint-Gobain India Glass Ltd",
    contactPerson: "Arun Krishnan",
    email: "orders.india@saint-gobain.com",
    phone: "+91 44 2716 8000",
    taxId: "33AAACS1234E1ZP",
    address: "Plot No. A-1, SIPCOT Industrial Park, Sriperumbudur, Tamil Nadu 602105",
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: "supp-002",
    name: "Asahi India Glass (AIS)",
    contactPerson: "Manish Verma",
    email: "commercial@aisglass.com",
    phone: "+91 124 406 2212",
    taxId: "06AAACA5555L1Z1",
    address: "Unit 203, Global Business Park, MG Road, Gurgaon 122002",
    createdAt: new Date(Date.now() - 50 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: "supp-003",
    name: "Kuraray India Pvt Ltd",
    contactPerson: "Deepak Mehta",
    email: "sales.sg@kuraray.com",
    phone: "+91 22 6788 9000",
    taxId: "27AAACK3333R1ZX",
    address: "B Wing, Delphi Building, Hiranandani Business Park, Powai, Mumbai 400076",
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 86400000).toISOString()
  },
  {
    id: "supp-004",
    name: "DOW Chemical International",
    contactPerson: "Siddharth Rao",
    email: "sealants.india@dow.com",
    phone: "+91 22 6150 7000",
    taxId: "27AAACD9999K1ZM",
    address: "1st Floor, Block B, Godrej IT Park, Vikhroli West, Mumbai 400079",
    createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 86400000).toISOString()
  },
  {
    id: "supp-005",
    name: "Bohle Machine & Tools India",
    contactPerson: "Kavita Sen",
    email: "sales@bohle-india.com",
    phone: "+91 20 2712 4455",
    taxId: "27AAACB2222N1ZW",
    address: "Bhosari Industrial Estate, Pune, Maharashtra 411026",
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 86400000).toISOString()
  }
];

const initialInventory = [
  {
    id: "inv-001",
    sku: "FLT-CLR-04-3222",
    name: "Clear Annealed Float Glass 4mm (3210x2250)",
    category: "FLOAT_SHEET",
    glassType: "ANNEALED_FLOAT",
    thicknessMm: 4.0,
    widthMm: 3210.0,
    heightMm: 2250.0,
    stockQuantity: 120.0,
    unitOfMeasure: "Sheets",
    reorderLevel: 30.0,
    unitCost: 450.0,
    unitPrice: 720.0,
    rackLocation: "Rack A-01",
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: "inv-002",
    sku: "FLT-CLR-06-3222",
    name: "Clear Annealed Float Glass 6mm (3210x2250)",
    category: "FLOAT_SHEET",
    glassType: "ANNEALED_FLOAT",
    thicknessMm: 6.0,
    widthMm: 3210.0,
    heightMm: 2250.0,
    stockQuantity: 95.0,
    unitOfMeasure: "Sheets",
    reorderLevel: 25.0,
    unitCost: 650.0,
    unitPrice: 980.0,
    rackLocation: "Rack A-02",
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: "inv-003",
    sku: "FLT-CLR-10-3222",
    name: "Clear Annealed Float Glass 10mm (3210x2250)",
    category: "FLOAT_SHEET",
    glassType: "ANNEALED_FLOAT",
    thicknessMm: 10.0,
    widthMm: 3210.0,
    heightMm: 2250.0,
    stockQuantity: 60.0,
    unitOfMeasure: "Sheets",
    reorderLevel: 20.0,
    unitCost: 1100.0,
    unitPrice: 1650.0,
    rackLocation: "Rack A-03",
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: "inv-004",
    sku: "FLT-CLR-12-3222",
    name: "Clear Annealed Float Glass 12mm (3210x2250)",
    category: "FLOAT_SHEET",
    glassType: "ANNEALED_FLOAT",
    thicknessMm: 12.0,
    widthMm: 3210.0,
    heightMm: 2250.0,
    stockQuantity: 45.0,
    unitOfMeasure: "Sheets",
    reorderLevel: 15.0,
    unitCost: 1350.0,
    unitPrice: 2050.0,
    rackLocation: "Rack A-04",
    createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: "inv-005",
    sku: "TGH-CLR-10-2412",
    name: "Toughened Tempered Glass 10mm (2400x1200)",
    category: "FINISHED_GLASS",
    glassType: "TOUGHENED_TEMPERED",
    thicknessMm: 10.0,
    widthMm: 2400.0,
    heightMm: 1200.0,
    stockQuantity: 18.0,
    unitOfMeasure: "Sheets",
    reorderLevel: 10.0,
    unitCost: 1600.0,
    unitPrice: 2400.0,
    rackLocation: "Rack B-01",
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: "inv-006",
    sku: "LAM-CLR-12-3222",
    name: "Laminated Safety Glass 11.52mm (5+1.52+5)",
    category: "FLOAT_SHEET",
    glassType: "LAMINATED",
    thicknessMm: 12.0,
    widthMm: 3210.0,
    heightMm: 2250.0,
    stockQuantity: 25.0,
    unitOfMeasure: "Sheets",
    reorderLevel: 10.0,
    unitCost: 2200.0,
    unitPrice: 3200.0,
    rackLocation: "Rack B-02",
    createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: "inv-007",
    sku: "LOWE-SOL-06-3222",
    name: "Low-E Solar Control High-Performance 6mm",
    category: "FLOAT_SHEET",
    glassType: "LOW_E",
    thicknessMm: 6.0,
    widthMm: 3210.0,
    heightMm: 2250.0,
    stockQuantity: 6.0, // Low stock warning!
    unitOfMeasure: "Sheets",
    reorderLevel: 15.0,
    unitCost: 1400.0,
    unitPrice: 2100.0,
    rackLocation: "Rack A-05",
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: "inv-008",
    sku: "MIR-SLV-05-2418",
    name: "Copper-Free Silver Mirror 5mm (2440x1830)",
    category: "FLOAT_SHEET",
    glassType: "MIRROR",
    thicknessMm: 5.0,
    widthMm: 2440.0,
    heightMm: 1830.0,
    stockQuantity: 35.0,
    unitOfMeasure: "Sheets",
    reorderLevel: 12.0,
    unitCost: 850.0,
    unitPrice: 1300.0,
    rackLocation: "Rack C-01",
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: "inv-009",
    sku: "FST-ACD-08-2418",
    name: "Frosted Acid-Etched Translucent 8mm",
    category: "FLOAT_SHEET",
    glassType: "FROSTED_ACID_ETCHED",
    thicknessMm: 8.0,
    widthMm: 2440.0,
    heightMm: 1830.0,
    stockQuantity: 5.0, // Low stock warning!
    unitOfMeasure: "Sheets",
    reorderLevel: 10.0,
    unitCost: 1200.0,
    unitPrice: 1850.0,
    rackLocation: "Rack C-02",
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: "inv-010",
    sku: "RAW-PVB-152-CLR",
    name: "PVB Interlayer Architectural Film Roll 1.52mm",
    category: "RAW_MATERIAL",
    glassType: null,
    thicknessMm: 1.52,
    widthMm: 2200.0,
    heightMm: null,
    stockQuantity: 14.0,
    unitOfMeasure: "Rolls",
    reorderLevel: 5.0,
    unitCost: 8500.0,
    unitPrice: 12000.0,
    rackLocation: "Rack M-01",
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: "inv-011",
    sku: "HDW-SPID-4WAY",
    name: "SS 316 4-Way Spider Fitting for Curtain Wall",
    category: "HARDWARE_FITTINGS",
    glassType: null,
    thicknessMm: null,
    widthMm: null,
    heightMm: null,
    stockQuantity: 80.0,
    unitOfMeasure: "Units",
    reorderLevel: 20.0,
    unitCost: 950.0,
    unitPrice: 1500.0,
    rackLocation: "Rack H-01",
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: "inv-012",
    sku: "CON-SLNT-DOW995",
    name: "DOWSIL 995 Structural Glazing Silicone Sealant 600ml",
    category: "CONSUMABLE",
    glassType: null,
    thicknessMm: null,
    widthMm: null,
    heightMm: null,
    stockQuantity: 120.0,
    unitOfMeasure: "Sausages",
    reorderLevel: 30.0,
    unitCost: 380.0,
    unitPrice: 580.0,
    rackLocation: "Rack S-01",
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  }
];

const initialPurchaseOrders = [
  {
    id: "po-001",
    orderNumber: "PO-2026-001",
    supplierId: "supp-001",
    totalAmount: 112500.0,
    status: "COMPLETED",
    notes: "Restocking primary clear float glass packs for architectural projects",
    purchaseDate: new Date(Date.now() - 18 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    items: [
      {
        id: "poi-001",
        purchaseOrderId: "po-001",
        itemId: "inv-003",
        quantity: 50.0,
        unitCost: 1100.0,
        totalCost: 55000.0
      },
      {
        id: "poi-002",
        purchaseOrderId: "po-001",
        itemId: "inv-004",
        quantity: 35.0,
        unitCost: 1350.0,
        totalCost: 47250.0
      },
      {
        id: "poi-003",
        purchaseOrderId: "po-001",
        itemId: "inv-001",
        quantity: 20.0,
        unitCost: 512.5,
        totalCost: 10250.0
      }
    ]
  },
  {
    id: "po-002",
    orderNumber: "PO-2026-002",
    supplierId: "supp-003",
    totalAmount: 51000.0,
    status: "COMPLETED",
    notes: "PVB interlayer procurement for safety lamination line",
    purchaseDate: new Date(Date.now() - 12 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    items: [
      {
        id: "poi-004",
        purchaseOrderId: "po-002",
        itemId: "inv-010",
        quantity: 6.0,
        unitCost: 8500.0,
        totalCost: 51000.0
      }
    ]
  },
  {
    id: "po-003",
    orderNumber: "PO-2026-003",
    supplierId: "supp-004",
    totalAmount: 38000.0,
    status: "COMPLETED",
    notes: "High-grade structural silicone batch replenishment",
    purchaseDate: new Date(Date.now() - 6 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    items: [
      {
        id: "poi-005",
        purchaseOrderId: "po-003",
        itemId: "inv-012",
        quantity: 100.0,
        unitCost: 380.0,
        totalCost: 38000.0
      }
    ]
  }
];

const initialQuotations = [
  {
    id: "qt-001",
    quotationNumber: "QT-2026-001",
    customerId: "cust-001",
    subtotal: 185000.0,
    taxAmount: 33300.0, // 18% GST
    discountAmount: 5000.0,
    totalAmount: 213300.0,
    status: "COMPLETED",
    validUntil: new Date(Date.now() + 15 * 86400000).toISOString(),
    notes: "Commercial office glass partitions with polished edges and CNC cutout handle holes",
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    items: [
      {
        id: "qti-001",
        quotationId: "qt-001",
        itemId: "inv-004",
        glassType: "TOUGHENED_TEMPERED",
        thicknessMm: 12.0,
        widthMm: 2400.0,
        heightMm: 1200.0,
        areaSqM: 2.88,
        quantity: 25,
        edgeWork: "FLAT_POLISH",
        holesCount: 4,
        unitPrice: 5800.0,
        lineTotal: 145000.0
      },
      {
        id: "qti-002",
        quotationId: "qt-001",
        itemId: "inv-003",
        glassType: "TOUGHENED_TEMPERED",
        thicknessMm: 10.0,
        widthMm: 2000.0,
        heightMm: 1000.0,
        areaSqM: 2.0,
        quantity: 10,
        edgeWork: "FLAT_POLISH",
        holesCount: 2,
        unitPrice: 4000.0,
        lineTotal: 40000.0
      }
    ]
  },
  {
    id: "qt-002",
    quotationNumber: "QT-2026-002",
    customerId: "cust-002",
    subtotal: 142500.0,
    taxAmount: 25650.0,
    discountAmount: 2500.0,
    totalAmount: 165650.0,
    status: "CONFIRMED",
    validUntil: new Date(Date.now() + 20 * 86400000).toISOString(),
    notes: "Laminated acoustic façade glass panels for IT park installation",
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    items: [
      {
        id: "qti-003",
        quotationId: "qt-002",
        itemId: "inv-006",
        glassType: "LAMINATED",
        thicknessMm: 12.0,
        widthMm: 3000.0,
        heightMm: 1500.0,
        areaSqM: 4.5,
        quantity: 15,
        edgeWork: "SEAMED_ARRIS",
        holesCount: 0,
        unitPrice: 9500.0,
        lineTotal: 142500.0
      }
    ]
  },
  {
    id: "qt-003",
    quotationNumber: "QT-2026-003",
    customerId: "cust-003",
    subtotal: 38400.0,
    taxAmount: 6912.0,
    discountAmount: 1000.0,
    totalAmount: 44312.0,
    status: "ISSUED",
    validUntil: new Date(Date.now() + 10 * 86400000).toISOString(),
    notes: "Custom frameless shower cubicle with beveled edges and towel bar holes",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    items: [
      {
        id: "qti-004",
        quotationId: "qt-003",
        itemId: "inv-003",
        glassType: "TOUGHENED_TEMPERED",
        thicknessMm: 10.0,
        widthMm: 2100.0,
        heightMm: 900.0,
        areaSqM: 1.89,
        quantity: 4,
        edgeWork: "BEVELED",
        holesCount: 3,
        unitPrice: 6600.0,
        lineTotal: 26400.0
      },
      {
        id: "qti-005",
        quotationId: "qt-003",
        itemId: "inv-008",
        glassType: "MIRROR",
        thicknessMm: 5.0,
        widthMm: 1800.0,
        heightMm: 1000.0,
        areaSqM: 1.8,
        quantity: 2,
        edgeWork: "PENCIL_POLISH",
        holesCount: 0,
        unitPrice: 6000.0,
        lineTotal: 12000.0
      }
    ]
  },
  {
    id: "qt-004",
    quotationNumber: "QT-2026-004",
    customerId: "cust-005",
    subtotal: 64200.0,
    taxAmount: 11556.0,
    discountAmount: 0.0,
    totalAmount: 75756.0,
    status: "DRAFT",
    validUntil: new Date(Date.now() + 25 * 86400000).toISOString(),
    notes: "Acid-etched decorative panels for executive cabins",
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    items: [
      {
        id: "qti-006",
        quotationId: "qt-004",
        itemId: "inv-009",
        glassType: "FROSTED_ACID_ETCHED",
        thicknessMm: 8.0,
        widthMm: 2100.0,
        heightMm: 1200.0,
        areaSqM: 2.52,
        quantity: 8,
        edgeWork: "FLAT_POLISH",
        holesCount: 2,
        unitPrice: 8025.0,
        lineTotal: 64200.0
      }
    ]
  }
];

const initialStockMovements = [
  {
    id: "sm-001",
    itemId: "inv-003",
    quantity: 50.0,
    reason: "PURCHASE_RECEIPT",
    referenceId: "po-001",
    notes: "Received shipment from Saint-Gobain PO-2026-001",
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString()
  },
  {
    id: "sm-002",
    itemId: "inv-004",
    quantity: 35.0,
    reason: "PURCHASE_RECEIPT",
    referenceId: "po-001",
    notes: "Received shipment from Saint-Gobain PO-2026-001",
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString()
  },
  {
    id: "sm-003",
    itemId: "inv-010",
    quantity: 6.0,
    reason: "PURCHASE_RECEIPT",
    referenceId: "po-002",
    notes: "Received PVB rolls from Kuraray PO-2026-002",
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString()
  },
  {
    id: "sm-004",
    itemId: "inv-004",
    quantity: -25.0,
    reason: "QUOTATION_FULFILLMENT",
    referenceId: "qt-001",
    notes: "Dispatched order for Apex Glass QT-2026-001",
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: "sm-005",
    itemId: "inv-007",
    quantity: -2.0,
    reason: "SCRAP_BREAKAGE",
    referenceId: null,
    notes: "Edge crack during automated unloading from transport A-frame",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  }
];

module.exports = {
  initialCustomers,
  initialSuppliers,
  initialInventory,
  initialPurchaseOrders,
  initialQuotations,
  initialStockMovements
};
