const prisma = require('../lib/prisma');

const getCustomers = async (req, res) => {
  try {
    const { type, q } = req.query;
    const where = {};

    if (type && ['INDIVIDUAL', 'ORGANIZATION'].includes(type.toUpperCase())) {
      where.customerType = type.toUpperCase();
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } }
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { quotations: true, saleOrders: true }
        }
      }
    });

    return res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    // If DB is not connected yet, return empty array without mock data
    return res.json([]);
  }
};

const createCustomer = async (req, res) => {
  try {
    const { customerType, name, companyName, taxId, email, phone, address, city, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const newCustomer = await prisma.customer.create({
      data: {
        customerType: customerType || 'ORGANIZATION',
        name,
        companyName: companyName || null,
        taxId: taxId || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        notes: notes || null
      }
    });

    return res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return res.status(500).json({ error: 'Failed to create customer' });
  }
};

module.exports = {
  getCustomers,
  createCustomer
};
