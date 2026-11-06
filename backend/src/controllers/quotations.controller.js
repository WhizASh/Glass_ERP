const prisma = require('../lib/prisma');

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

    return res.json(quotations);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return res.json([]);
  }
};

const createQuotation = async (req, res) => {
  try {
    const {
      customerId,
      quoteNumber,
      validUntil,
      taxRate = 0,
      notes,
      sections = []
    } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer is required' });
    }

    const generatedQuoteNumber = quoteNumber || `QT-${Date.now().toString().slice(-6)}`;

    // Calculate subtotal from sections & items
    let subtotal = 0;
    const formattedSections = sections.map((sec, secIdx) => {
      const items = (sec.items || []).map(item => {
        const qty = parseFloat(item.quantity) || 1;
        const price = parseFloat(item.unitPrice) || 0;
        const total = qty * price;
        subtotal += total;

        return {
          productSkuId: item.productSkuId,
          description: item.description || null,
          widthMm: item.widthMm ? parseFloat(item.widthMm) : null,
          heightMm: item.heightMm ? parseFloat(item.heightMm) : null,
          quantity: qty,
          areaSqM: item.areaSqM ? parseFloat(item.areaSqM) : null,
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

    const taxAmount = (subtotal * parseFloat(taxRate)) / 100;
    const totalAmount = subtotal + taxAmount;

    const newQuotation = await prisma.quotation.create({
      data: {
        quoteNumber: generatedQuoteNumber,
        customerId,
        status: 'DRAFT',
        validUntil: validUntil ? new Date(validUntil) : null,
        subtotal,
        taxRate: parseFloat(taxRate),
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
            items: true
          }
        }
      }
    });

    return res.status(201).json(newQuotation);
  } catch (error) {
    console.error('Error creating quotation:', error);
    return res.status(500).json({ error: 'Failed to create quotation' });
  }
};

module.exports = {
  getQuotations,
  createQuotation
};
