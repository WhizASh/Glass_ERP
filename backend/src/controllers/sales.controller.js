const { settlement, SettlementError } = require('../services/settlement.service');
const prisma = require('../lib/prisma');
const { calculateItemSqft, calculateDiscount } = require('../services/glassCalculations.service');

const normalizeSale = (sale) => {
  if (!sale) return null;

  return {
    ...sale,
    paymentMode: (sale.paymentMode || 'CASH').toUpperCase() === 'ONLINE' ? 'ONLINE' : 'CASH',
    subtotal: Number(sale.subtotal !== null && sale.subtotal !== undefined ? sale.subtotal : sale.totalAmount) || 0,
    discountType: sale.discountType || 'PERCENTAGE',
    discountValue: Number(sale.discountValue) || 0,
    discountAmount: Number(sale.discountAmount) || 0,
    taxRate: Number(sale.taxRate) || 0,
    taxAmount: Number(sale.taxAmount) || 0,
    totalAmount: Number(sale.totalAmount) || 0,
    isLocked: Boolean(sale.isLocked),
    items: Array.isArray(sale.items)
      ? sale.items.map(item => ({
          ...item,
          quantity: Number(item.quantity) || 1,
          widthInches: item.widthInches !== null && item.widthInches !== undefined ? Number(item.widthInches) : null,
          heightInches: item.heightInches !== null && item.heightInches !== undefined ? Number(item.heightInches) : null,
          areaSqFt: item.areaSqFt !== null && item.areaSqFt !== undefined ? Number(item.areaSqFt) : null,
          unitPrice: Number(item.unitPrice) || 0,
          totalPrice: Number(item.totalPrice) || 0
        }))
      : []
  };
};

let isMigrationChecked = false;
const ensureSaleColumns = async () => {
  if (isMigrationChecked) return;
  try {
    const statements = [
      'ALTER TABLE "sale_orders" ADD COLUMN IF NOT EXISTS "paymentMode" TEXT NOT NULL DEFAULT \'CASH\';',
      'ALTER TABLE "sale_orders" ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(65,30);',
      'ALTER TABLE "sale_orders" ADD COLUMN IF NOT EXISTS "discountType" TEXT NOT NULL DEFAULT \'PERCENTAGE\';',
      'ALTER TABLE "sale_orders" ADD COLUMN IF NOT EXISTS "discountValue" DECIMAL(65,30) NOT NULL DEFAULT 0;',
      'ALTER TABLE "sale_orders" ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;',
      'ALTER TABLE "sale_orders" ADD COLUMN IF NOT EXISTS "taxRate" DECIMAL(65,30) NOT NULL DEFAULT 0;',
      'ALTER TABLE "sale_orders" ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;',
      'ALTER TABLE "sale_orders" ADD COLUMN IF NOT EXISTS "isLocked" BOOLEAN NOT NULL DEFAULT false;',
      'ALTER TABLE "sale_order_items" ALTER COLUMN "productSkuId" DROP NOT NULL;',
      'ALTER TABLE "sale_order_items" ADD COLUMN IF NOT EXISTS "widthInches" DECIMAL(65,30);',
      'ALTER TABLE "sale_order_items" ADD COLUMN IF NOT EXISTS "heightInches" DECIMAL(65,30);',
      'ALTER TABLE "sale_order_items" ADD COLUMN IF NOT EXISTS "areaSqFt" DECIMAL(65,30);'
    ];
    for (const sql of statements) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (err) {
        // Individual column failure shouldn't abort check
      }
    }
    isMigrationChecked = true;
  } catch (e) {
    // DB connection or permission fallback
  }
};

const getSales = async (req, res) => {
  try {
    await ensureSaleColumns();
    const { status, paymentStatus, q } = req.query;
    const where = {};

    if (status) {
      where.status = status.toUpperCase();
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus.toUpperCase();
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
      discountType,
      discountValue,
      taxRate: inputTaxRate,
      isLocked: inputIsLocked,
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
    let referencedQuote = null;
    if (quotationId) {
      referencedQuote = await prisma.quotation.findUnique({
        where: { id: quotationId },
        include: { sections: { include: { items: true } } }
      });
      if (!referencedQuote) {
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

    let subtotal = 0;
    const formattedItems = items.map((item, idx) => {
      const qty = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.unitPrice) || 0;
      const widthIn = item.widthInches ? parseFloat(item.widthInches) : null;
      const heightIn = item.heightInches ? parseFloat(item.heightInches) : null;

      // 1. Calculate square footage per piece
      let sqftPerPiece = (widthIn && heightIn)
        ? calculateItemSqft(widthIn, heightIn)
        : (item.areaSqFt ? parseFloat(item.areaSqFt) : null);

      // 2. Calculate line total square footage
      let totalSqft = null;
      if (item.totalSqft !== undefined && item.totalSqft !== null && item.totalSqft !== '') {
        totalSqft = parseFloat(item.totalSqft);
        if (!sqftPerPiece && qty > 0) {
          sqftPerPiece = Number((totalSqft / qty).toFixed(2));
        }
      } else if (sqftPerPiece && sqftPerPiece > 0) {
        totalSqft = Number((sqftPerPiece * qty).toFixed(2));
      }

      // 3. Line total: sqft * price if sqft exists, otherwise qty * price
      let lineTotal = 0;
      if (totalSqft !== null && totalSqft > 0) {
        lineTotal = Number((totalSqft * price).toFixed(2));
      } else if (item.totalPrice !== undefined && item.totalPrice !== null && Number(item.totalPrice) > 0) {
        lineTotal = Number(parseFloat(item.totalPrice).toFixed(2));
      } else {
        lineTotal = Number((qty * price).toFixed(2));
      }

      subtotal += lineTotal;

      return {
        id: item.id || `item-${Date.now()}-${idx}`,
        sectionName: item.sectionName || null,
        productSkuId: (item.productSkuId && validSkuIds.has(item.productSkuId)) ? item.productSkuId : null,
        description: item.description || null,
        widthInches: widthIn,
        heightInches: heightIn,
        areaSqFt: sqftPerPiece || (totalSqft ? Number((totalSqft / qty).toFixed(2)) : null),
        widthMm: item.widthMm ? parseFloat(item.widthMm) : null,
        heightMm: item.heightMm ? parseFloat(item.heightMm) : null,
        quantity: qty,
        unitPrice: price,
        totalPrice: lineTotal
      };
    });

    // Discount & Tax calculations
    const discType = discountType || 'PERCENTAGE';
    const discVal = discountValue !== undefined && discountValue !== null
      ? Math.max(0, parseFloat(discountValue) || 0)
      : 0;
    const discountAmount = calculateDiscount(subtotal, discType, discVal);
    const taxableSubtotal = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));

    const taxRate = inputTaxRate !== undefined && inputTaxRate !== null
      ? Math.max(0, parseFloat(inputTaxRate) || 0)
      : 0;
    const taxAmount = Number(((taxableSubtotal * taxRate) / 100).toFixed(2));
    const totalAmount = Number((taxableSubtotal + taxAmount).toFixed(2));
    const isLockedOnCreate = inputIsLocked && normalizedPaymentStatus === 'PAID';

    const newSale = await prisma.saleOrder.create({
      data: {
        orderNumber: generatedOrderNumber,
        customerId,
        quotationId: validQuotationId,
        status: normalizedStatus,
        ...settlement(req.body, totalAmount, 'amountReceived'),
        paymentMode: normalizedPaymentMode,
        deliveryAddress: deliveryAddress || null,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        subtotal,
        discountType: discType,
        discountValue: discVal,
        discountAmount,
        taxRate,
        taxAmount,
        totalAmount,
        isLocked: isLockedOnCreate,
        items: {
          create: formattedItems.map(item => ({
            sectionName: item.sectionName,
            productSkuId: item.productSkuId,
            description: item.description,
            widthInches: item.widthInches,
            heightInches: item.heightInches,
            areaSqFt: item.areaSqFt,
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
    if (error instanceof SettlementError) return res.status(400).json({ error: error.message });
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
      discountType,
      discountValue,
      taxRate: inputTaxRate,
      isLocked: inputIsLocked,
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

    // Guardrail: Locked sale records cannot be modified
    if (existingSale.isLocked) {
      return res.status(400).json({
        error: 'This sale order is locked because payment is complete and cannot be modified. Unlock it first if adjustments are necessary.'
      });
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

    let subtotal = Number(existingSale.subtotal ?? existingSale.totalAmount) || 0;
    let discType = discountType || existingSale.discountType || 'PERCENTAGE';
    let discVal = discountValue !== undefined ? Math.max(0, parseFloat(discountValue) || 0) : Number(existingSale.discountValue || 0);
    let discountAmount = Number(existingSale.discountAmount) || 0;
    let taxRate = inputTaxRate !== undefined ? Math.max(0, parseFloat(inputTaxRate) || 0) : Number(existingSale.taxRate || 0);
    let taxAmount = Number(existingSale.taxAmount) || 0;
    let totalAmount = Number(existingSale.totalAmount);
    let formattedItems = existingSale.items || [];

    if (!isDelivered && Array.isArray(items) && items.length > 0) {
      subtotal = 0;
      formattedItems = items.map((item, idx) => {
        const qty = parseFloat(item.quantity) || 1;
        const price = parseFloat(item.unitPrice) || 0;
        const widthIn = item.widthInches ? parseFloat(item.widthInches) : null;
        const heightIn = item.heightInches ? parseFloat(item.heightInches) : null;

        let sqftPerPiece = (widthIn && heightIn)
          ? calculateItemSqft(widthIn, heightIn)
          : (item.areaSqFt ? parseFloat(item.areaSqFt) : null);

        let totalSqft = null;
        if (item.totalSqft !== undefined && item.totalSqft !== null && item.totalSqft !== '') {
          totalSqft = parseFloat(item.totalSqft);
          if (!sqftPerPiece && qty > 0) {
            sqftPerPiece = Number((totalSqft / qty).toFixed(2));
          }
        } else if (sqftPerPiece && sqftPerPiece > 0) {
          totalSqft = Number((sqftPerPiece * qty).toFixed(2));
        }

        let lineTotal = 0;
        if (totalSqft !== null && totalSqft > 0) {
          lineTotal = Number((totalSqft * price).toFixed(2));
        } else if (item.totalPrice !== undefined && item.totalPrice !== null && Number(item.totalPrice) > 0) {
          lineTotal = Number(parseFloat(item.totalPrice).toFixed(2));
        } else {
          lineTotal = Number((qty * price).toFixed(2));
        }

        subtotal += lineTotal;

        return {
          id: item.id || `item-${Date.now()}-${idx}`,
          saleOrderId: id,
          sectionName: item.sectionName || null,
          productSkuId: (item.productSkuId && validSkuIds.has(item.productSkuId)) ? item.productSkuId : null,
          description: item.description || null,
          widthInches: widthIn,
          heightInches: heightIn,
          areaSqFt: sqftPerPiece || (totalSqft ? Number((totalSqft / qty).toFixed(2)) : null),
          widthMm: item.widthMm ? parseFloat(item.widthMm) : null,
          heightMm: item.heightMm ? parseFloat(item.heightMm) : null,
          quantity: qty,
          unitPrice: price,
          totalPrice: lineTotal
        };
      });

      discountAmount = calculateDiscount(subtotal, discType, discVal);
      const taxableSubtotal = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));
      taxAmount = Number(((taxableSubtotal * taxRate) / 100).toFixed(2));
      totalAmount = Number((taxableSubtotal + taxAmount).toFixed(2));
    }

    const updateData = {
      paymentMode: normalizedPaymentMode,
      ...settlement(req.body, totalAmount, 'amountReceived', existingSale),
      status: normalizedStatus,
      deliveryAddress: deliveryAddress !== undefined ? deliveryAddress : existingSale.deliveryAddress,
      subtotal,
      discountType: discType,
      discountValue: discVal,
      discountAmount,
      taxRate,
      taxAmount,
      totalAmount
    };

    let targetIsLocked = existingSale.isLocked;
    if (inputIsLocked !== undefined) {
      if (inputIsLocked && normalizedPaymentStatus !== 'PAID') {
        return res.status(400).json({
          error: 'Only sale orders with completed payment (PAID) can be locked.'
        });
      }
      targetIsLocked = Boolean(inputIsLocked);
    }
    updateData.isLocked = targetIsLocked;

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
                widthInches: item.widthInches,
                heightInches: item.heightInches,
                areaSqFt: item.areaSqFt,
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
    if (error instanceof SettlementError) return res.status(400).json({ error: error.message });
    console.error('Error updating sale order in database:', error.message || error);
    return res.status(500).json({ error: 'Failed to update sale order' });
  }
};

const toggleSaleLock = async (req, res) => {
  const { id } = req.params;
  try {
    await ensureSaleColumns();
    const existing = await prisma.saleOrder.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Sale order not found' });
    }

    const targetLock = req.body && req.body.isLocked !== undefined
      ? Boolean(req.body.isLocked)
      : !existing.isLocked;

    if (targetLock && existing.paymentStatus !== 'PAID') {
      return res.status(400).json({
        error: 'Cannot lock sale record: Payment is not complete. Payment status must be PAID to lock this record.'
      });
    }

    const updated = await prisma.saleOrder.update({
      where: { id },
      data: { isLocked: targetLock },
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
    console.error('Error updating lock status on sale order:', error.message || error);
    return res.status(500).json({ error: 'Failed to update lock status on sale order' });
  }
};

module.exports = {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  toggleSaleLock
};
