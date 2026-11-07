const prisma = require('../lib/prisma');
const { inMemoryCustomers } = require('./customers.controller');
const { inMemoryProducts } = require('./products.controller');

let inMemorySales = [
  {
    id: 'sale-sample-01',
    orderNumber: 'SO-100201',
    customerId: inMemoryCustomers[0]?.id || 'cust-nagpur-glass',
    quotationId: 'quote-sample-facade-01',
    status: 'IN_PRODUCTION',
    paymentStatus: 'PARTIAL',
    paymentMode: 'ONLINE',
    orderDate: new Date(Date.now() - 3600000 * 48).toISOString(),
    deliveryAddress: 'Plot 14, Commercial Area, Hingna Road, Nagpur',
    totalAmount: 5560,
    customer: inMemoryCustomers[0],
    quotation: {
      id: 'quote-sample-facade-01',
      quoteNumber: '201'
    },
    items: [
      {
        id: 'so-item-01',
        saleOrderId: 'sale-sample-01',
        sectionName: 'Ground Floor Elevation',
        productSkuId: inMemoryProducts[0]?.id || null,
        productSku: inMemoryProducts[0] || null,
        description: '12mm Clear Toughened Glass (57" x 44")',
        widthMm: 1447.8,
        heightMm: 1117.6,
        quantity: 1,
        unitPrice: 3700,
        totalPrice: 3700
      },
      {
        id: 'so-item-02',
        saleOrderId: 'sale-sample-01',
        sectionName: 'Ground Floor Elevation',
        productSkuId: inMemoryProducts[1]?.id || null,
        productSku: inMemoryProducts[1] || null,
        description: '10mm Toughened Glass (35.5" x 24")',
        widthMm: 901.7,
        heightMm: 609.6,
        quantity: 2,
        unitPrice: 930,
        totalPrice: 1860
      }
    ],
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'sale-sample-02',
    orderNumber: 'SO-100202',
    customerId: inMemoryCustomers[1]?.id || 'cust-apex-infra',
    quotationId: null,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    paymentMode: 'CASH',
    orderDate: new Date(Date.now() - 3600000 * 10).toISOString(),
    deliveryAddress: 'Site 8, Hinjewadi Phase 2, Pune',
    totalAmount: 4300,
    customer: inMemoryCustomers[1],
    quotation: null,
    items: [
      {
        id: 'so-item-03',
        saleOrderId: 'sale-sample-02',
        sectionName: null,
        productSkuId: inMemoryProducts[1]?.id || null,
        productSku: inMemoryProducts[1] || null,
        description: '10mm Clear Toughened Glass (Partition Panels)',
        widthMm: 1200,
        heightMm: 2100,
        quantity: 2,
        unitPrice: 2150,
        totalPrice: 4300
      }
    ],
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 10).toISOString()
  }
];

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
    // In-memory or connection offline
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

    if (sales && sales.length > 0) {
      return res.json(sales.map(normalizeSale));
    }

    // In-memory fallback filtering
    let filtered = [...inMemorySales];
    if (status) {
      filtered = filtered.filter(s => s.status.toUpperCase() === status.toUpperCase());
    }
    if (q) {
      const query = q.toLowerCase();
      filtered = filtered.filter(s =>
        (s.orderNumber && s.orderNumber.toLowerCase().includes(query)) ||
        (s.customer?.name && s.customer.name.toLowerCase().includes(query)) ||
        (s.customer?.companyName && s.customer.companyName.toLowerCase().includes(query))
      );
    }
    return res.json(filtered.map(normalizeSale));
  } catch (error) {
    console.error('Error fetching sales, falling back to in-memory store:', error.message);
    const { status, q } = req.query;
    let filtered = [...inMemorySales];
    if (status) {
      filtered = filtered.filter(s => s.status.toUpperCase() === status.toUpperCase());
    }
    if (q) {
      const query = q.toLowerCase();
      filtered = filtered.filter(s =>
        (s.orderNumber && s.orderNumber.toLowerCase().includes(query)) ||
        (s.customer?.name && s.customer.name.toLowerCase().includes(query)) ||
        (s.customer?.companyName && s.customer.companyName.toLowerCase().includes(query))
      );
    }
    return res.json(filtered.map(normalizeSale));
  }
};

const getSaleById = async (req, res) => {
  const { id } = req.params;
  try {
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

    const fallback = inMemorySales.find(s => s.id === id || s.orderNumber === id);
    if (fallback) {
      return res.json(normalizeSale(fallback));
    }
    return res.status(404).json({ error: 'Sale order not found' });
  } catch (error) {
    console.error('Error fetching sale by id, using fallback:', error.message);
    const fallback = inMemorySales.find(s => s.id === id || s.orderNumber === id);
    if (fallback) {
      return res.json(normalizeSale(fallback));
    }
    return res.status(404).json({ error: 'Sale order not found' });
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
        productSkuId: item.productSkuId || null,
        description: item.description || null,
        widthMm: item.widthMm ? parseFloat(item.widthMm) : null,
        heightMm: item.heightMm ? parseFloat(item.heightMm) : null,
        quantity: qty,
        unitPrice: price,
        totalPrice: total
      };
    });

    try {
      const newSale = await prisma.saleOrder.create({
        data: {
          orderNumber: generatedOrderNumber,
          customerId,
          quotationId: quotationId || null,
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
    } catch (dbErr) {
      console.warn('Prisma create failed, falling back to in-memory store:', dbErr.message);
      const customer = inMemoryCustomers.find(c => c.id === customerId) || { id: customerId, name: 'Direct Customer' };
      const fallbackSale = {
        id: `sale-${Date.now()}`,
        orderNumber: generatedOrderNumber,
        customerId,
        customer,
        quotationId: quotationId || null,
        quotation: quotationId ? { id: quotationId, quoteNumber: `QT-${quotationId.slice(-4)}` } : null,
        status: normalizedStatus,
        paymentStatus: normalizedPaymentStatus,
        paymentMode: normalizedPaymentMode,
        deliveryAddress: deliveryAddress || null,
        orderDate: orderDate ? new Date(orderDate).toISOString() : new Date().toISOString(),
        totalAmount,
        items: formattedItems.map(item => ({
          ...item,
          productSku: inMemoryProducts.find(p => p.id === item.productSkuId) || null
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      inMemorySales.unshift(fallbackSale);
      return res.status(201).json(normalizeSale(fallbackSale));
    }
  } catch (error) {
    console.error('Error creating sale order:', error);
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

    // First retrieve target existing order (from DB or inMemory)
    let existingSale = null;
    try {
      existingSale = await prisma.saleOrder.findUnique({
        where: { id },
        include: { items: true }
      });
    } catch (e) {
      // DB might be down
    }
    if (!existingSale) {
      existingSale = inMemorySales.find(s => s.id === id || s.orderNumber === id);
    }

    if (!existingSale) {
      return res.status(404).json({ error: 'Sale order not found' });
    }

    // Guardrail: Cancelled orders cannot be modified
    if (existingSale.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cancelled orders cannot be modified' });
    }

    const normalizedPaymentMode = paymentMode
      ? (paymentMode.toUpperCase() === 'ONLINE' ? 'ONLINE' : 'CASH')
      : existingSale.paymentMode;
    const normalizedPaymentStatus = paymentStatus || existingSale.paymentStatus;
    const normalizedStatus = status || existingSale.status;
    const isDelivered = existingSale.status === 'DELIVERED';

    // If order was delivered, fabrication line items are locked to maintain audit accuracy,
    // but payment status, payment mode, and delivery address can be updated.
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
          productSkuId: item.productSkuId || null,
          description: item.description || null,
          widthMm: item.widthMm ? parseFloat(item.widthMm) : null,
          heightMm: item.heightMm ? parseFloat(item.heightMm) : null,
          quantity: qty,
          unitPrice: price,
          totalPrice: total
        };
      });
    }

    try {
      const updateData = {
        paymentMode: normalizedPaymentMode,
        paymentStatus: normalizedPaymentStatus,
        status: normalizedStatus,
        deliveryAddress: deliveryAddress !== undefined ? deliveryAddress : existingSale.deliveryAddress,
        totalAmount
      };

      if (customerId) updateData.customerId = customerId;
      if (quotationId !== undefined) updateData.quotationId = quotationId || null;
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
    } catch (dbErr) {
      console.warn('Prisma update failed, updating in-memory store:', dbErr.message);
      const index = inMemorySales.findIndex(s => s.id === id || s.orderNumber === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Sale order not found' });
      }

      const current = inMemorySales[index];
      const customer = customerId
        ? (inMemoryCustomers.find(c => c.id === customerId) || current.customer)
        : current.customer;

      const updatedSale = {
        ...current,
        customerId: customerId || current.customerId,
        customer,
        quotationId: quotationId !== undefined ? (quotationId || null) : current.quotationId,
        paymentMode: normalizedPaymentMode,
        paymentStatus: normalizedPaymentStatus,
        status: normalizedStatus,
        deliveryAddress: deliveryAddress !== undefined ? deliveryAddress : current.deliveryAddress,
        orderDate: orderDate ? new Date(orderDate).toISOString() : current.orderDate,
        totalAmount,
        items: formattedItems.map(item => ({
          ...item,
          productSku: inMemoryProducts.find(p => p.id === item.productSkuId) || item.productSku || null
        })),
        updatedAt: new Date().toISOString()
      };

      inMemorySales[index] = updatedSale;
      return res.json(normalizeSale(updatedSale));
    }
  } catch (error) {
    console.error('Error updating sale order:', error);
    return res.status(500).json({ error: 'Failed to update sale order' });
  }
};

module.exports = {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  inMemorySales
};
