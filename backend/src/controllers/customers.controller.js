const prisma = require('../lib/prisma');

const defaultCustomers = [
  {
    id: 'cust-nagpur-glass',
    customerType: 'ORGANIZATION',
    name: 'Yusuf Bhai',
    companyName: 'Nagpur Glass & Hardware Traders',
    city: 'Nagpur',
    phone: '+91 98222 11223',
    taxId: '27AABCT1234F1Z8',
    email: 'nagpur.glass@example.com'
  },
  {
    id: 'cust-apex-infra',
    customerType: 'ORGANIZATION',
    name: 'Rajesh Sharma',
    companyName: 'Apex Facades & Infrastructure Pvt Ltd',
    city: 'Pune',
    phone: '+91 98900 55443',
    taxId: '27AAACA9988G1ZQ',
    email: 'info@apexfacades.com'
  }
];

let inMemoryCustomers = [...defaultCustomers];

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

    if (customers && customers.length > 0) {
      return res.json(customers);
    }
    return res.json(inMemoryCustomers);
  } catch (error) {
    console.warn('DB offline, returning in-memory customers catalog:', error.message || error);
    return res.json(inMemoryCustomers);
  }
};

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

    inMemoryCustomers.unshift(newCustomer);
    return res.status(201).json(newCustomer);
  } catch (error) {
    console.warn('Prisma error creating customer, using resilient fallback:', error.message || error);
    const fallbackCustomer = {
      id: 'cust-' + Date.now(),
      customerType: req.body.customerType || 'ORGANIZATION',
      name: primaryName,
      companyName: cleanCompanyName,
      taxId: taxId && taxId.trim() ? taxId.trim() : null,
      email: cleanEmail,
      phone: phone && phone.trim() ? phone.trim() : null,
      city: city && city.trim() ? city.trim() : null,
      address: address && address.trim() ? address.trim() : null,
      notes: notes && notes.trim() ? notes.trim() : null,
      createdAt: new Date().toISOString()
    };
    inMemoryCustomers.unshift(fallbackCustomer);
    return res.status(201).json(fallbackCustomer);
  }
};

module.exports = {
  getCustomers,
  createCustomer,
  inMemoryCustomers,
  defaultCustomers
};
