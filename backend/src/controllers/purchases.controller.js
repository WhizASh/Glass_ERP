const prisma = require('../lib/prisma');
const { parsePurchase } = require('../services/purchases.service');

const createPurchase = async (req, res) => {
  let data;
  try {
    data = parsePurchase(req.body);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  try {
    const purchase = req.params.id
      ? await prisma.purchase.update({ where: { id: req.params.id }, data })
      : await prisma.purchase.create({ data });
    return res.status(req.params.id ? 200 : 201).json(purchase);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Purchase not found.' });
    console.error('Error creating purchase:', error.message);
    return res.status(500).json({ error: 'Failed to save purchase. Please try again.' });
  }
};

const getPurchases = async (req, res) => {
  const { q = '', page = '1' } = req.query;
  if (typeof q !== 'string' || q.length > 200 || typeof page !== 'string' || !/^[1-9]\d{0,5}$/.test(page)) {
    return res.status(400).json({ error: 'Invalid purchase search or page' });
  }
  const where = q.trim() ? {
    OR: ['materialName', 'supplier'].map(field => ({ [field]: { contains: q.trim(), mode: 'insensitive' } }))
  } : {};
  try {
    const pageSize = 25;
    const [records, total] = await prisma.$transaction([
      prisma.purchase.findMany({ where, orderBy: [{ purchaseDate: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }], skip: (Number(page) - 1) * pageSize, take: pageSize }),
      prisma.purchase.count({ where })
    ]);
    return res.json({ records, total, page: Number(page), pageSize });
  } catch (error) {
    console.error('Error fetching purchases:', error.message);
    return res.status(500).json({ error: 'Failed to load purchases. Please try again.' });
  }
};

module.exports = { createPurchase, getPurchases };
