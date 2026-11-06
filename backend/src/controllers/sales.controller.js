const prisma = require('../lib/prisma');

const getSales = async (req, res) => {
  try {
    const { status, q } = req.query;
    const where = {};

    if (status) {
      where.status = status.toUpperCase();
    }

    if (q) {
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { companyName: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const sales = await prisma.saleOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        quotation: true,
        items: {
          include: {
            productSku: true
          }
        }
      }
    });

    return res.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return res.json([]);
  }
};

const createSale = async (req, res) => {
  try {
    const {
      customerId,
      quotationId,
      orderNumber,
      deliveryAddress,
      items = []
    } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer is required' });
    }

    const generatedOrderNumber = orderNumber || `SO-${Date.now().toString().slice(-6)}`;

    let totalAmount = 0;
    const formattedItems = items.map(item => {
      const qty = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.unitPrice) || 0;
      const total = qty * price;
      totalAmount += total;

      return {
        sectionName: item.sectionName || null,
        productSkuId: item.productSkuId,
        description: item.description || null,
        widthMm: item.widthMm ? parseFloat(item.widthMm) : null,
        heightMm: item.heightMm ? parseFloat(item.heightMm) : null,
        quantity: qty,
        unitPrice: price,
        totalPrice: total
      };
    });

    const newSale = await prisma.saleOrder.create({
      data: {
        orderNumber: generatedOrderNumber,
        customerId,
        quotationId: quotationId || null,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        deliveryAddress: deliveryAddress || null,
        totalAmount,
        items: {
          create: formattedItems
        }
      },
      include: {
        customer: true,
        items: true
      }
    });

    return res.status(201).json(newSale);
  } catch (error) {
    console.error('Error creating sale order:', error);
    return res.status(500).json({ error: 'Failed to create sale order' });
  }
};

module.exports = {
  getSales,
  createSale
};
