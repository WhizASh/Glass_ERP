const prisma = require('../lib/prisma');

const normalizeSale = (sale) => ({
  ...sale,
  paymentMode: (sale.paymentMode || 'CASH').toUpperCase() === 'ONLINE' ? 'ONLINE' : 'CASH',
  totalAmount: Number(sale.totalAmount) || 0
});

let isMigrationChecked = false;
const ensureSaleColumns = async () => {
  if (isMigrationChecked) return;
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "sale_orders" ADD COLUMN IF NOT EXISTS "paymentMode" TEXT NOT NULL DEFAULT 'CASH';
      ALTER TABLE "sale_order_items" ALTER COLUMN "productSkuId" DROP NOT NULL;
    `);
    isMigrationChecked = true;
  } catch (e) {
    // If table doesn't exist yet or connection error, allow prisma to handle error
  }
};

const getSales = async (req, res) => {
  try {
    await ensureSaleColumns();
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

    // Pure DB: returns empty array if no orders exist in the database
    return res.json(sales.map(normalizeSale));
  } catch (error) {
    console.error('Error fetching sales from database:', error.message || error);
    return res.status(500).json({ error: 'Failed to fetch sales orders from database' });
  }
};

const getSaleById = async (req, res) => {
  const { id } = req.params;
  try {
    await ensureSaleColumns();
    const sale = await prisma.saleOrder.findUnique({
      where: { id },
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

    if (sale) {
      return res.json(normalizeSale(sale));
    }
    return res.status(404).json({ error: 'Sale order not found' });
  } catch (error) {
    console.error('Error fetching sale by id from database:', error.message || error);
    return res.status(500).json({ error: 'Failed to fetch sale order from database' });
  }
};

const createSale = async (req, res) => {
  try {
    await ensureSaleColumns();
    const {
      customerId,
      quotationId,
      orderNumber,
      paymentMode,
      paymentStatus,
      status,
      deliveryAddress,
      orderDate,
      items = []
    } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer is required' });
    }

    // Defensive check: Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });
    if (!customer) {
      return res.status(400).json({ error: 'Selected customer does not exist' });
    }

    // Defensive check: Verify quotation exists if provided
    let validQuotationId = null;
    if (quotationId) {
      const quote = await prisma.quotation.findUnique({
        where: { id: quotationId }
      });
      if (!quote) {
        return res.status(400).json({ error: 'Selected quotation does not exist' });
      }
      validQuotationId = quotationId;
    }

    // Fetch valid SKU IDs to prevent foreign key errors on custom items
    const existingSkus = await prisma.productSku.findMany({ select: { id: true } });
    const validSkuIds = new Set(existingSkus.map(s => s.id));

    const generatedOrderNumber = orderNumber || `SO-${Date.now().toString().slice(-6)}`;
    const normalizedPaymentMode = (paymentMode || 'CASH').toUpperCase() === 'ONLINE' ? 'ONLINE' : 'CASH';
    const normalizedPaymentStatus = paymentStatus || 'UNPAID';
    const normalizedStatus = status || 'PENDING';

    let totalAmount = 0;
    const formattedItems = items.map((item, idx) => {
      const qty = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.unitPrice) || 0;
      const total = qty * price;
      totalAmount += total;

      return {
        id: item.id || `item-${Date.now()}-${idx}`,
        sectionName: item.sectionName || null,
        productSkuId: (item.productSkuId && validSkuIds.has(item.productSkuId)) ? item.productSkuId : null,
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
        quotationId: validQuotationId,
        status: normalizedStatus,
        paymentStatus: normalizedPaymentStatus,
        paymentMode: normalizedPaymentMode,
        deliveryAddress: deliveryAddress || null,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        totalAmount,
        items: {
          create: formattedItems.map(item => ({
            sectionName: item.sectionName,
            productSkuId: item.productSkuId,
            description: item.description,
            widthMm: item.widthMm,
            heightMm: item.heightMm,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          }))
        }
      },
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

    return res.status(201).json(normalizeSale(newSale));
  } catch (error) {
    console.error('Error creating sale order in database:', error.message || error);
    return res.status(500).json({ error: 'Failed to create sale order' });
  }
};

const updateSale = async (req, res) => {
  const { id } = req.params;
  try {
    await ensureSaleColumns();
    const {
      customerId,
      quotationId,
      deliveryAddress,
      paymentMode,
      paymentStatus,
      status,
      orderDate,
      items
    } = req.body;

    const existingSale = await prisma.saleOrder.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingSale) {
      return res.status(404).json({ error: 'Sale order not found' });
    }

    // Guardrail: Cancelled orders cannot be modified
    if (existingSale.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cancelled orders cannot be modified' });
    }

    if (customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        return res.status(400).json({ error: 'Selected customer does not exist' });
      }
    }

    let validQuotationId = undefined;
    if (quotationId !== undefined) {
      if (quotationId) {
        const quote = await prisma.quotation.findUnique({ where: { id: quotationId } });
        if (!quote) {
          return res.status(400).json({ error: 'Selected quotation does not exist' });
        }
        validQuotationId = quotationId;
      } else {
        validQuotationId = null;
      }
    }

    const existingSkus = await prisma.productSku.findMany({ select: { id: true } });
    const validSkuIds = new Set(existingSkus.map(s => s.id));

    const normalizedPaymentMode = paymentMode
      ? (paymentMode.toUpperCase() === 'ONLINE' ? 'ONLINE' : 'CASH')
      : existingSale.paymentMode;
    const normalizedPaymentStatus = paymentStatus || existingSale.paymentStatus;
    const normalizedStatus = status || existingSale.status;
    const isDelivered = existingSale.status === 'DELIVERED';

    let totalAmount = Number(existingSale.totalAmount);
    let formattedItems = existingSale.items || [];

    if (!isDelivered && Array.isArray(items) && items.length > 0) {
      totalAmount = 0;
      formattedItems = items.map((item, idx) => {
        const qty = parseFloat(item.quantity) || 1;
        const price = parseFloat(item.unitPrice) || 0;
        const total = qty * price;
        totalAmount += total;

        return {
          id: item.id || `item-${Date.now()}-${idx}`,
          saleOrderId: id,
          sectionName: item.sectionName || null,
          productSkuId: (item.productSkuId && validSkuIds.has(item.productSkuId)) ? item.productSkuId : null,
          description: item.description || null,
          widthMm: item.widthMm ? parseFloat(item.widthMm) : null,
          heightMm: item.heightMm ? parseFloat(item.heightMm) : null,
          quantity: qty,
          unitPrice: price,
          totalPrice: total
        };
      });
    }

    const updateData = {
      paymentMode: normalizedPaymentMode,
      paymentStatus: normalizedPaymentStatus,
      status: normalizedStatus,
      deliveryAddress: deliveryAddress !== undefined ? deliveryAddress : existingSale.deliveryAddress,
      totalAmount
    };

    if (customerId) updateData.customerId = customerId;
    if (validQuotationId !== undefined) updateData.quotationId = validQuotationId;
    if (orderDate) updateData.orderDate = new Date(orderDate);

    if (!isDelivered && Array.isArray(items) && items.length > 0) {
      // Transactionally replace items
      await prisma.$transaction([
        prisma.saleOrderItem.deleteMany({ where: { saleOrderId: id } }),
        prisma.saleOrder.update({
          where: { id },
          data: {
            ...updateData,
            items: {
              create: formattedItems.map(item => ({
                sectionName: item.sectionName,
                productSkuId: item.productSkuId,
                description: item.description,
                widthMm: item.widthMm,
                heightMm: item.heightMm,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice
              }))
            }
          }
        })
      ]);
    } else {
      await prisma.saleOrder.update({
        where: { id },
        data: updateData
      });
    }

    const updated = await prisma.saleOrder.findUnique({
      where: { id },
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

    return res.json(normalizeSale(updated));
  } catch (error) {
    console.error('Error updating sale order in database:', error.message || error);
    return res.status(500).json({ error: 'Failed to update sale order' });
  }
};

module.exports = {
  getSales,
  getSaleById,
  createSale,
  updateSale
};
