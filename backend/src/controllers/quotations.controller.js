const prisma = require('../lib/prisma');
const { inMemoryCustomers } = require('./customers.controller');
const { inMemoryProducts } = require('./products.controller');

let inMemoryQuotations = [
  {
    id: 'quote-sample-facade-01',
    quoteNumber: '201',
    customerId: 'cust-nagpur-glass',
    status: 'ACCEPTED',
    issueDate: new Date().toISOString(),
    validUntil: null,
    subtotal: 5400,
    discountType: 'PERCENTAGE',
    discountValue: 0,
    discountAmount: 0,
    taxRate: 18,
    taxAmount: 972,
    totalAmount: 6372,
    notes: 'Architectural Glazing Specification with commercial 6" grid billing calculation.',
    customer: inMemoryCustomers[0],
    sections: [
      {
        id: 'sec-ground-facade',
        sectionName: 'Ground Floor Elevation',
        sortOrder: 0,
        items: [
          {
            id: 'item-01',
            productSkuId: inMemoryProducts[0].id,
            description: inMemoryProducts[0].name,
            widthInches: 57,
            heightInches: 44,
            roundedWidthInches: 60,
            roundedHeightInches: 48,
            quantity: 1,
            areaSqFt: 20,
            unitPrice: 185,
            totalPrice: 3700,
            productSku: inMemoryProducts[0]
          },
          {
            id: 'item-02',
            productSkuId: inMemoryProducts[1].id,
            description: inMemoryProducts[1].name,
            widthInches: 35.5,
            heightInches: 24,
            roundedWidthInches: 36,
            roundedHeightInches: 24,
            quantity: 2,
            areaSqFt: 6,
            unitPrice: 155,
            totalPrice: 1860,
            productSku: inMemoryProducts[1]
          }
        ]
      }
    ],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'quote-sample-curtain-02',
    quoteNumber: '202',
    customerId: 'cust-nagpur-glass',
    status: 'SENT',
    issueDate: new Date().toISOString(),
    validUntil: null,
    subtotal: 8200,
    discountType: 'PERCENTAGE',
    discountValue: 5,
    discountAmount: 410,
    taxRate: 18,
    taxAmount: 1402.2,
    totalAmount: 9192.2,
    notes: 'Curtain wall structural glazing takeoff with 5% discount.',
    customer: inMemoryCustomers[0],
    sections: [
      {
        id: 'sec-curtain-wall',
        sectionName: '1st Floor Curtain Wall',
        sortOrder: 0,
        items: [
          {
            id: 'item-03',
            productSkuId: inMemoryProducts[1].id,
            description: inMemoryProducts[1].name,
            widthInches: 48,
            heightInches: 60,
            roundedWidthInches: 48,
            roundedHeightInches: 60,
            quantity: 2,
            areaSqFt: 20,
            unitPrice: 205,
            totalPrice: 8200,
            productSku: inMemoryProducts[1]
          }
        ]
      }
    ],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'quote-sample-canopy-03',
    quoteNumber: '203',
    customerId: 'cust-nagpur-glass',
    status: 'CANCELLED',
    issueDate: new Date().toISOString(),
    validUntil: null,
    subtotal: 3200,
    discountType: 'FIXED',
    discountValue: 0,
    discountAmount: 0,
    taxRate: 18,
    taxAmount: 576,
    totalAmount: 3776,
    notes: 'Glass Canopy Over Entrance — Cancelled per architect revision.',
    customer: inMemoryCustomers[0],
    sections: [
      {
        id: 'sec-canopy',
        sectionName: 'Main Entrance Canopy',
        sortOrder: 0,
        items: [
          {
            id: 'item-04',
            productSkuId: inMemoryProducts[0].id,
            description: inMemoryProducts[0].name,
            widthInches: 36,
            heightInches: 48,
            roundedWidthInches: 36,
            roundedHeightInches: 48,
            quantity: 1,
            areaSqFt: 12,
            unitPrice: 266.67,
            totalPrice: 3200,
            productSku: inMemoryProducts[0]
          }
        ]
      }
    ],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

let isDbMigrationDone = false;
let isMemMigrationDone = false;
let isStarterQuotesSeeded = false;

/**
 * Ensures starter sample quotations exist in the PostgreSQL database
 * so relations to quotations from sale orders are always valid.
 */
const ensureStarterQuotations = async () => {
  if (isStarterQuotesSeeded) return;
  try {
    for (const q of inMemoryQuotations) {
      const existing = await prisma.quotation.findUnique({ where: { id: q.id } });
      if (!existing) {
        await prisma.quotation.create({
          data: {
            id: q.id,
            quoteNumber: q.quoteNumber,
            customerId: q.customerId,
            status: q.status,
            issueDate: new Date(q.issueDate),
            validUntil: q.validUntil ? new Date(q.validUntil) : null,
            subtotal: q.subtotal,
            discountType: q.discountType,
            discountValue: q.discountValue,
            discountAmount: q.discountAmount,
            taxRate: q.taxRate,
            taxAmount: q.taxAmount,
            totalAmount: q.totalAmount,
            notes: q.notes,
            sections: {
              create: q.sections.map((sec) => ({
                id: sec.id,
                sectionName: sec.sectionName,
                sortOrder: sec.sortOrder,
                items: {
                  create: sec.items.map((it) => ({
                    id: it.id,
                    productSkuId: it.productSkuId,
                    description: it.description,
                    widthInches: it.widthInches,
                    heightInches: it.heightInches,
                    roundedWidthInches: it.roundedWidthInches,
                    roundedHeightInches: it.roundedHeightInches,
                    quantity: it.quantity,
                    areaSqFt: it.areaSqFt,
                    unitPrice: it.unitPrice,
                    totalPrice: it.totalPrice
                  }))
                }
              }))
            }
          }
        });
      }
    }
    isStarterQuotesSeeded = true;
  } catch (err) {
    // If DB is offline or table not ready, allow fallback
  }
};

/**
 * Normalizes existing quotations in database and in-memory store so they use
 * 3-digit incremental numbers (e.g. 201, 202, 203) instead of random timestamps.
 */
const normalizeExistingQuoteNumbers = async () => {
  if (!isDbMigrationDone) {
    try {
      const allQuotes = await prisma.quotation.findMany({
        orderBy: { createdAt: 'asc' },
        select: { id: true, quoteNumber: true }
      });

      if (allQuotes && allQuotes.length > 0) {
        const nonNumericQuotes = allQuotes.filter((q) => !/^\d+$/.test(String(q.quoteNumber).trim()));
        if (nonNumericQuotes.length > 0) {
          console.log(`[Quote Migration] Found ${nonNumericQuotes.length} legacy quote numbers in DB. Migrating to sequential 3-digit numbers starting from 201...`);
          const takenNumbers = new Set(allQuotes.map((q) => q.quoteNumber));
          let seq = 201;

          for (const quote of allQuotes) {
            if (!/^\d+$/.test(String(quote.quoteNumber).trim())) {
              while (takenNumbers.has(String(seq))) {
                seq++;
              }
              const targetNumber = String(seq);
              try {
                await prisma.quotation.update({
                  where: { id: quote.id },
                  data: { quoteNumber: targetNumber }
                });
                takenNumbers.delete(quote.quoteNumber);
                takenNumbers.add(targetNumber);
                console.log(`[Quote Migration] Migrated quote ${quote.id}: ${quote.quoteNumber} -> ${targetNumber}`);
              } catch (err) {
                console.warn(`[Quote Migration] Failed to update quote ${quote.id}:`, err.message || err);
              }
              seq++;
            }
          }
        }
      }
      isDbMigrationDone = true;
    } catch (err) {
      // Prisma offline or connection unreachable, will retry when Prisma is reachable
    }
  }

  // Also normalize in-memory store if needed
  if (!isMemMigrationDone) {
    let memSeq = 201;
    inMemoryQuotations.forEach((q) => {
      if (!/^\d+$/.test(String(q.quoteNumber).trim())) {
        q.quoteNumber = String(memSeq);
      }
      memSeq++;
    });
    isMemMigrationDone = true;
  }
};

/**
 * Generates the next sequential quotation number starting from 3 digits (e.g. 201, 202, 203),
 * and automatically extending to 4 digits after 999 (1000, 1001, etc.).
 */
const generateNextQuoteNumber = async () => {
  let existingQuoteNumbers = [];

  try {
    const quotes = await prisma.quotation.findMany({
      select: { quoteNumber: true }
    });
    existingQuoteNumbers = quotes.map((q) => q.quoteNumber);
  } catch (err) {
    existingQuoteNumbers = inMemoryQuotations.map((q) => q.quoteNumber);
  }

  inMemoryQuotations.forEach((q) => {
    if (q.quoteNumber && !existingQuoteNumbers.includes(q.quoteNumber)) {
      existingQuoteNumbers.push(q.quoteNumber);
    }
  });

  // Base starting point is 200 so the initial 3-digit quote is 201 (e.g. 201, 202, 203)
  let maxNum = 200;

  for (const qn of existingQuoteNumbers) {
    if (!qn) continue;
    const trimmed = String(qn).trim();
    if (/^\d+$/.test(trimmed)) {
      const val = parseInt(trimmed, 10);
      if (val >= 100 && val > maxNum) {
        maxNum = val;
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidate = nextNum < 100 ? String(nextNum).padStart(3, '0') : String(nextNum);

  // Guarantee candidate is unique against any existing quote number in DB or memory
  while (existingQuoteNumbers.includes(candidate)) {
    nextNum += 1;
    candidate = nextNum < 100 ? String(nextNum).padStart(3, '0') : String(nextNum);
  }

  return candidate;
};

// Eagerly trigger migration and starter seeding on startup
normalizeExistingQuoteNumbers().catch(() => {});
ensureStarterQuotations().catch(() => {});

const getQuotations = async (req, res) => {
  await normalizeExistingQuoteNumbers();
  await ensureStarterQuotations();
  try {
    const { status, q } = req.query;
    const where = {};

    if (status) {
      where.status = status.toUpperCase();
    }

    if (q) {
      where.OR = [
        { quoteNumber: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { companyName: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const quotations = await prisma.quotation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        sections: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              include: {
                productSku: true
              }
            }
          }
        }
      }
    });

    if (quotations && quotations.length > 0) {
      return res.json(quotations);
    }
    return res.json(inMemoryQuotations);
  } catch (error) {
    console.warn('DB offline, returning in-memory quotations store:', error.message || error);
    return res.json(inMemoryQuotations);
  }
};

const roundDimensionTo6Inches = (inches) => {
  const val = parseFloat(inches);
  if (!val || val <= 0) return 0;
  return Math.max(6, Math.ceil(val / 6) * 6);
};

const calculateSqft = (wIn, hIn) => {
  const rw = roundDimensionTo6Inches(wIn);
  const rh = roundDimensionTo6Inches(hIn);
  if (rw <= 0 || rh <= 0) return 0;
  return Number(((rw * rh) / 144).toFixed(2));
};

const createQuotation = async (req, res) => {
  await normalizeExistingQuoteNumbers();
  const {
    customerId,
    quoteNumber,
    validUntil,
    discountType = 'PERCENTAGE',
    discountValue = 0,
    taxRate = 0,
    notes,
    sections = []
  } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: 'Customer is required' });
  }

  const generatedQuoteNumber = quoteNumber
    ? String(quoteNumber).trim()
    : await generateNextQuoteNumber();

  // Calculate subtotal from sections & items
  let subtotal = 0;
  const formattedSections = sections.map((sec, secIdx) => {
    const rawItems = Array.isArray(sec.items) ? sec.items : (sec.items?.create || []);
    const items = rawItems.map((item) => {
      const qty = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.unitPrice) || 0;
      
      let widthInches = item.widthInches !== undefined && item.widthInches !== null && item.widthInches !== '' ? parseFloat(item.widthInches) : null;
      let heightInches = item.heightInches !== undefined && item.heightInches !== null && item.heightInches !== '' ? parseFloat(item.heightInches) : null;
      let roundedW = widthInches ? roundDimensionTo6Inches(widthInches) : null;
      let roundedH = heightInches ? roundDimensionTo6Inches(heightInches) : null;
      let sqft = (widthInches && heightInches) ? calculateSqft(widthInches, heightInches) : (item.areaSqFt ? parseFloat(item.areaSqFt) : null);

      let widthMm = item.widthMm ? parseFloat(item.widthMm) : null;
      let heightMm = item.heightMm ? parseFloat(item.heightMm) : null;
      let areaSqM = item.areaSqM ? parseFloat(item.areaSqM) : null;

      if (sqft && !areaSqM) {
        areaSqM = parseFloat((sqft * 0.092903).toFixed(4));
      } else if (!sqft && widthMm && heightMm) {
        areaSqM = parseFloat(((widthMm * heightMm) / 1000000).toFixed(4));
        sqft = parseFloat((areaSqM / 0.092903).toFixed(2));
      }

      const total = item.totalPrice !== undefined && item.totalPrice !== null
        ? parseFloat(item.totalPrice)
        : (sqft ? parseFloat((qty * sqft * price).toFixed(2)) : (areaSqM ? parseFloat((qty * areaSqM * price).toFixed(2)) : parseFloat((qty * price).toFixed(2))));
      
      subtotal += total;

      return {
        productSkuId: item.productSkuId,
        description: item.description || null,
        widthMm,
        heightMm,
        widthInches,
        heightInches,
        roundedWidthInches: roundedW,
        roundedHeightInches: roundedH,
        quantity: qty,
        areaSqM,
        areaSqFt: sqft,
        unitPrice: price,
        totalPrice: total
      };
    });

    return {
      sectionName: sec.sectionName || `Section ${secIdx + 1}`,
      sortOrder: secIdx,
      items: {
        create: items
      }
    };
  });

  const dVal = parseFloat(discountValue) || 0;
  const isPercentage = (discountType || 'PERCENTAGE').toUpperCase() === 'PERCENTAGE' || discountType === '%';
  const discountAmount = isPercentage
    ? parseFloat(((subtotal * dVal) / 100).toFixed(2))
    : Math.min(dVal, subtotal);

  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const taxRateNum = parseFloat(taxRate) || 0;
  const taxAmount = parseFloat(((taxableSubtotal * taxRateNum) / 100).toFixed(2));
  const totalAmount = parseFloat((taxableSubtotal + taxAmount).toFixed(2));

  try {
    const newQuotation = await prisma.quotation.create({
      data: {
        quoteNumber: generatedQuoteNumber,
        customerId,
        status: 'DRAFT',
        validUntil: validUntil ? new Date(validUntil) : null,
        subtotal,
        discountType: isPercentage ? 'PERCENTAGE' : 'FIXED',
        discountValue: dVal,
        discountAmount,
        taxRate: taxRateNum,
        taxAmount,
        totalAmount,
        notes: notes || null,
        sections: {
          create: formattedSections
        }
      },
      include: {
        customer: true,
        sections: {
          include: {
            items: {
              include: {
                productSku: true
              }
            }
          }
        }
      }
    });

    return res.status(201).json(newQuotation);
  } catch (error) {
    console.warn('Error creating quotation with Prisma, using fallback:', error.message || error);
    const matchedCustomer = inMemoryCustomers.find((c) => c.id === customerId) || {
      id: customerId,
      name: 'Client',
      companyName: 'Client Architectural Firm'
    };

    const fallbackQuote = {
      id: 'quote-' + Date.now(),
      quoteNumber: generatedQuoteNumber,
      customerId,
      customer: matchedCustomer,
      status: 'DRAFT',
      issueDate: new Date().toISOString(),
      validUntil: validUntil ? new Date(validUntil) : null,
      subtotal,
      discountType: isPercentage ? 'PERCENTAGE' : 'FIXED',
      discountValue: dVal,
      discountAmount,
      taxRate: taxRateNum,
      taxAmount,
      totalAmount,
      notes: notes || null,
      sections: formattedSections.map((sec) => {
        const rawItems = Array.isArray(sec.items) ? sec.items : (sec.items?.create || []);
        return {
          ...sec,
          items: rawItems.map((item) => ({
            ...item,
            productSku: inMemoryProducts.find((p) => p.id === item.productSkuId) || null
          }))
        };
      }),
      createdAt: new Date().toISOString()
    };

    inMemoryQuotations.unshift(fallbackQuote);
    return res.status(201).json(fallbackQuote);
  }
};

const getQuotationById = async (req, res) => {
  const { id } = req.params;
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        sections: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              include: {
                productSku: true
              }
            }
          }
        }
      }
    });

    if (quotation) {
      return res.json(quotation);
    }

    const fallback = inMemoryQuotations.find((q) => q.id === id || q.quoteNumber === id);
    if (fallback) {
      return res.json(fallback);
    }

    return res.status(404).json({ error: 'Quotation not found' });
  } catch (error) {
    console.warn('Error fetching quotation by ID from Prisma, checking in-memory store:', error.message || error);
    const fallback = inMemoryQuotations.find((q) => q.id === id || q.quoteNumber === id);
    if (fallback) {
      return res.json(fallback);
    }
    return res.status(500).json({ error: 'Failed to fetch quotation' });
  }
};

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

  if (!customerId) {
    return res.status(400).json({ error: 'Customer is required' });
  }

  // 1. Fetch current quotation to enforce lifecycle guardrails
  let currentQuote = null;
  try {
    currentQuote = await prisma.quotation.findUnique({
      where: { id },
      include: { customer: true }
    });
  } catch (err) {
    console.warn('Prisma lookup failed in updateQuotation, checking in-memory store:', err.message || err);
  }

  if (!currentQuote) {
    currentQuote = inMemoryQuotations.find((q) => q.id === id || q.quoteNumber === id);
  }

  if (!currentQuote) {
    return res.status(404).json({ error: 'Quotation not found' });
  }

  const currentStatus = (currentQuote.status || '').toUpperCase();
  if (currentStatus !== 'DRAFT' && currentStatus !== 'SENT') {
    return res.status(400).json({
      error: `Quotation is in ${currentStatus} status and cannot be edited. Only DRAFT and SENT (In Review) quotations can be modified.`
    });
  }

  // Calculate subtotal from sections & items
  let subtotal = 0;
  const formattedSections = sections.map((sec, secIdx) => {
    const rawItems = Array.isArray(sec.items) ? sec.items : (sec.items?.create || []);
    const items = rawItems.map((item) => {
      const qty = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.unitPrice) || 0;
      
      let widthInches = item.widthInches !== undefined && item.widthInches !== null && item.widthInches !== '' ? parseFloat(item.widthInches) : null;
      let heightInches = item.heightInches !== undefined && item.heightInches !== null && item.heightInches !== '' ? parseFloat(item.heightInches) : null;
      let roundedW = widthInches ? roundDimensionTo6Inches(widthInches) : null;
      let roundedH = heightInches ? roundDimensionTo6Inches(heightInches) : null;
      let sqft = (widthInches && heightInches) ? calculateSqft(widthInches, heightInches) : (item.areaSqFt ? parseFloat(item.areaSqFt) : null);

      let widthMm = item.widthMm ? parseFloat(item.widthMm) : null;
      let heightMm = item.heightMm ? parseFloat(item.heightMm) : null;
      let areaSqM = item.areaSqM ? parseFloat(item.areaSqM) : null;

      if (sqft && !areaSqM) {
        areaSqM = parseFloat((sqft * 0.092903).toFixed(4));
      } else if (!sqft && widthMm && heightMm) {
        areaSqM = parseFloat(((widthMm * heightMm) / 1000000).toFixed(4));
        sqft = parseFloat((areaSqM / 0.092903).toFixed(2));
      }

      const total = item.totalPrice !== undefined && item.totalPrice !== null
        ? parseFloat(item.totalPrice)
        : (sqft ? parseFloat((qty * sqft * price).toFixed(2)) : (areaSqM ? parseFloat((qty * areaSqM * price).toFixed(2)) : parseFloat((qty * price).toFixed(2))));
      
      subtotal += total;

      return {
        productSkuId: item.productSkuId,
        description: item.description || null,
        widthMm,
        heightMm,
        widthInches,
        heightInches,
        roundedWidthInches: roundedW,
        roundedHeightInches: roundedH,
        quantity: qty,
        areaSqM,
        areaSqFt: sqft,
        unitPrice: price,
        totalPrice: total
      };
    });

    return {
      sectionName: sec.sectionName || `Section ${secIdx + 1}`,
      sortOrder: secIdx,
      items: {
        create: items
      }
    };
  });

  const dVal = parseFloat(discountValue) || 0;
  const isPercentage = (discountType || 'PERCENTAGE').toUpperCase() === 'PERCENTAGE' || discountType === '%';
  const discountAmount = isPercentage
    ? parseFloat(((subtotal * dVal) / 100).toFixed(2))
    : Math.min(dVal, subtotal);

  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const taxRateNum = parseFloat(taxRate) || 0;
  const taxAmount = parseFloat(((taxableSubtotal * taxRateNum) / 100).toFixed(2));
  const totalAmount = parseFloat((taxableSubtotal + taxAmount).toFixed(2));

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Cascade delete existing sections and items for this quotation
      await tx.quotationSection.deleteMany({
        where: { quotationId: currentQuote.id }
      });

      return await tx.quotation.update({
        where: { id: currentQuote.id },
        data: {
          customerId,
          validUntil: validUntil ? new Date(validUntil) : null,
          subtotal,
          discountType: isPercentage ? 'PERCENTAGE' : 'FIXED',
          discountValue: dVal,
          discountAmount,
          taxRate: taxRateNum,
          taxAmount,
          totalAmount,
          notes: notes || null,
          sections: {
            create: formattedSections
          }
        },
        include: {
          customer: true,
          sections: {
            orderBy: { sortOrder: 'asc' },
            include: {
              items: {
                include: {
                  productSku: true
                }
              }
            }
          }
        }
      });
    });

    // Also update in-memory store if present
    const inMemIdx = inMemoryQuotations.findIndex((q) => q.id === currentQuote.id || q.quoteNumber === currentQuote.quoteNumber);
    if (inMemIdx !== -1) {
      inMemoryQuotations[inMemIdx] = updated;
    }

    return res.json(updated);
  } catch (error) {
    console.warn('Error updating quotation with Prisma, using in-memory fallback:', error.message || error);
    
    const matchedCustomer = inMemoryCustomers.find((c) => c.id === customerId) || currentQuote.customer || {
      id: customerId,
      name: 'Client',
      companyName: 'Client Architectural Firm'
    };

    const updatedInMemory = {
      ...currentQuote,
      customerId,
      customer: matchedCustomer,
      validUntil: validUntil ? new Date(validUntil) : null,
      subtotal,
      discountType: isPercentage ? 'PERCENTAGE' : 'FIXED',
      discountValue: dVal,
      discountAmount,
      taxRate: taxRateNum,
      taxAmount,
      totalAmount,
      notes: notes || null,
      sections: formattedSections.map((sec) => {
        const rawItems = Array.isArray(sec.items) ? sec.items : (sec.items?.create || []);
        return {
          id: sec.id || 'sec-' + Math.random().toString(36).substr(2, 9),
          sectionName: sec.sectionName,
          sortOrder: sec.sortOrder,
          items: rawItems.map((item) => ({
            id: item.id || 'item-' + Math.random().toString(36).substr(2, 9),
            ...item,
            productSku: inMemoryProducts.find((p) => p.id === item.productSkuId) || null
          }))
        };
      }),
      updatedAt: new Date().toISOString()
    };

    const inMemIdx = inMemoryQuotations.findIndex((q) => q.id === currentQuote.id || q.quoteNumber === currentQuote.quoteNumber);
    if (inMemIdx !== -1) {
      inMemoryQuotations[inMemIdx] = updatedInMemory;
    } else {
      inMemoryQuotations.unshift(updatedInMemory);
    }

    return res.json(updatedInMemory);
  }
};

const updateQuotationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const targetStatus = status.toUpperCase();

  // Guard against illegal transitions: once CANCELLED, quotation is permanently closed
  let currentStatus = null;
  try {
    const current = await prisma.quotation.findUnique({ where: { id }, select: { status: true } });
    if (current) currentStatus = current.status;
  } catch (_) {}
  if (!currentStatus) {
    const inMem = inMemoryQuotations.find((q) => q.id === id);
    if (inMem) currentStatus = inMem.status;
  }

  if (currentStatus === 'CANCELLED') {
    return res.status(400).json({ error: 'Quotation is cancelled and cannot be updated or accepted.' });
  }

  try {
    const updated = await prisma.quotation.update({
      where: { id },
      data: { status: targetStatus },
      include: {
        customer: true,
        sections: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              include: {
                productSku: true
              }
            }
          }
        }
      }
    });

    return res.json(updated);
  } catch (error) {
    console.warn('Error updating quotation status with Prisma, updating in-memory store:', error.message || error);
    const existing = inMemoryQuotations.find((q) => q.id === id);
    if (existing) {
      existing.status = targetStatus;
      return res.json(existing);
    }
    return res.status(500).json({ error: 'Failed to update quotation status' });
  }
};

const deleteQuotation = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.quotation.delete({
      where: { id }
    });
    inMemoryQuotations = inMemoryQuotations.filter((q) => q.id !== id && q.quoteNumber !== id);
    return res.json({ success: true, message: `Quotation ${id} deleted` });
  } catch (error) {
    inMemoryQuotations = inMemoryQuotations.filter((q) => q.id !== id && q.quoteNumber !== id);
    return res.json({ success: true, message: `Quotation ${id} removed` });
  }
};

module.exports = {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  deleteQuotation
};
