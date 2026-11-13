const prisma = require('../lib/prisma');

/**
 * GET /api/customers
 * Pure DB fetch with filtering by customerType and text query.
 */
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
    console.error('Error fetching customers from database:', error.message || error);
    return res.status(500).json({ error: 'Failed to fetch customers from database' });
  }
};

/**
 * POST /api/customers
 * Creates a customer directly in PostgreSQL via Prisma.
 */
const createCustomer = async (req, res) => {
  try {
    const { customerType, name, companyName, taxId, email, phone, address, city, notes } = req.body;

    const primaryName = (name || companyName || '').trim();
    if (!primaryName) {
      return res.status(400).json({ error: 'Customer Name or Company Name is required' });
    }

    const cleanEmail = email && email.trim() ? email.trim() : null;
    const cleanCompanyName = companyName && companyName.trim()
      ? companyName.trim()
      : (customerType === 'ORGANIZATION' ? primaryName : null);

    const newCustomer = await prisma.customer.create({
      data: {
        customerType: customerType || 'ORGANIZATION',
        name: primaryName,
        companyName: cleanCompanyName,
        taxId: taxId && taxId.trim() ? taxId.trim() : null,
        email: cleanEmail,
        phone: phone && phone.trim() ? phone.trim() : null,
        address: address && address.trim() ? address.trim() : null,
        city: city && city.trim() ? city.trim() : null,
        notes: notes && notes.trim() ? notes.trim() : null
      }
    });

    return res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer in database:', error.message || error);
    return res.status(500).json({ error: 'Failed to create customer in database' });
  }
};

module.exports = {
  getCustomers,
  createCustomer
};
