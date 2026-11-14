const prisma = require('../lib/prisma');
const {
  generateNextQuoteNumber,
  formatSectionsForPrisma,
  calculateQuotationTotals,
  normalizeQuotation,
  embedUnitInNotes
} = require('../services/quotations.service');

/**
 * GET /api/quotations
 * Pure DB fetch with status filtering and text search across quote number and customer name.
 */
const getQuotations = async (req, res) => {
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

    return res.json(quotations.map(normalizeQuotation));
  } catch (error) {
    console.error('Error fetching quotations from database:', error.message || error);
    return res.status(500).json({ error: 'Failed to fetch quotations from database' });
  }
};

/**
 * GET /api/quotations/:id
 * Pure DB lookup by ID or unique quoteNumber.
 */
const getQuotationById = async (req, res) => {
  const { id } = req.params;
  try {
    const quotation = await prisma.quotation.findFirst({
      where: {
        OR: [{ id }, { quoteNumber: id }]
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

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    return res.json(normalizeQuotation(quotation));
  } catch (error) {
    console.error('Error fetching quotation by ID from database:', error.message || error);
    return res.status(500).json({ error: 'Failed to fetch quotation from database' });
  }
};

/**
 * POST /api/quotations
 * Calculates totals and stores new quotation in PostgreSQL via Prisma.
 */
const createQuotation = async (req, res) => {
  const {
    customerId,
    quoteNumber,
    validUntil,
    measurementUnit = 'SQ_FT',
    discountType = 'PERCENTAGE',
    discountValue = 0,
    taxRate = 0,
    notes,
    sections = []
  } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: 'Customer is required' });
  }

  try {
    // Verify customer exists in database
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(400).json({ error: 'Selected customer does not exist' });
    }

    const generatedQuoteNumber = quoteNumber
      ? String(quoteNumber).trim()
      : await generateNextQuoteNumber(prisma);

    const { formattedSections, subtotal } = formatSectionsForPrisma(sections, measurementUnit);
    const totals = calculateQuotationTotals({
      subtotal,
      discountType,
      discountValue,
      taxRate
    });

    const embeddedNotes = embedUnitInNotes(notes, measurementUnit);

    const newQuotation = await prisma.quotation.create({
      data: {
        quoteNumber: generatedQuoteNumber,
        customerId,
        status: 'DRAFT',
        validUntil: validUntil ? new Date(validUntil) : null,
        subtotal: totals.subtotal,
        discountType: totals.discountType,
        discountValue: totals.discountValue,
        discountAmount: totals.discountAmount,
        taxRate: totals.taxRate,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        notes: embeddedNotes,
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

    return res.status(201).json(normalizeQuotation(newQuotation));
  } catch (error) {
    console.error('Error creating quotation in database:', error.message || error);
    return res.status(500).json({ error: 'Failed to create quotation in database' });
  }
};

/**
 * PUT /api/quotations/:id
 * Updates an existing DRAFT or SENT quotation transactionally.
 */
const updateQuotation = async (req, res) => {
  const { id } = req.params;
  const {
    customerId,
    validUntil,
    measurementUnit = 'SQ_FT',
    discountType = 'PERCENTAGE',
    discountValue = 0,
    taxRate = 0,
    notes,
    sections = []
  } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: 'Customer is required' });
  }

  try {
    const currentQuote = await prisma.quotation.findFirst({
      where: { OR: [{ id }, { quoteNumber: id }] },
      include: { customer: true }
    });

    if (!currentQuote) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const currentStatus = (currentQuote.status || '').toUpperCase();
    if (currentStatus !== 'DRAFT' && currentStatus !== 'SENT') {
      return res.status(400).json({
        error: `Quotation is in ${currentStatus} status and cannot be edited. Only DRAFT and SENT (In Review) quotations can be modified.`
      });
    }

    const { formattedSections, subtotal } = formatSectionsForPrisma(sections, measurementUnit);
    const totals = calculateQuotationTotals({
      subtotal,
      discountType,
      discountValue,
      taxRate
    });

    const embeddedNotes = embedUnitInNotes(notes, measurementUnit);

    const updated = await prisma.$transaction(async (tx) => {
      // Delete existing sections and items cascade
      await tx.quotationSection.deleteMany({
        where: { quotationId: currentQuote.id }
      });

      return await tx.quotation.update({
        where: { id: currentQuote.id },
        data: {
          customerId,
          validUntil: validUntil ? new Date(validUntil) : null,
          subtotal: totals.subtotal,
          discountType: totals.discountType,
          discountValue: totals.discountValue,
          discountAmount: totals.discountAmount,
          taxRate: totals.taxRate,
          taxAmount: totals.taxAmount,
          totalAmount: totals.totalAmount,
          notes: embeddedNotes,
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

    return res.json(normalizeQuotation(updated));
  } catch (error) {
    console.error('Error updating quotation in database:', error.message || error);
    return res.status(500).json({ error: 'Failed to update quotation in database' });
  }
};

/**
 * PATCH /api/quotations/:id/status
 * Validates and updates quotation status.
 */
const updateQuotationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const targetStatus = status.toUpperCase();

  try {
    const current = await prisma.quotation.findFirst({
      where: { OR: [{ id }, { quoteNumber: id }] },
      select: { id: true, status: true }
    });

    if (!current) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    if (current.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Quotation is cancelled and cannot be updated or accepted.' });
    }

    const updated = await prisma.quotation.update({
      where: { id: current.id },
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

    return res.json(normalizeQuotation(updated));
  } catch (error) {
    console.error('Error updating quotation status in database:', error.message || error);
    return res.status(500).json({ error: 'Failed to update quotation status in database' });
  }
};

/**
 * DELETE /api/quotations/:id
 * Deletes quotation from PostgreSQL.
 */
const deleteQuotation = async (req, res) => {
  const { id } = req.params;
  try {
    const current = await prisma.quotation.findFirst({
      where: { OR: [{ id }, { quoteNumber: id }] },
      select: { id: true }
    });

    if (!current) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    await prisma.quotation.delete({
      where: { id: current.id }
    });

    return res.json({ success: true, message: `Quotation ${id} deleted` });
  } catch (error) {
    console.error('Error deleting quotation from database:', error.message || error);
    return res.status(500).json({ error: 'Failed to delete quotation from database' });
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
