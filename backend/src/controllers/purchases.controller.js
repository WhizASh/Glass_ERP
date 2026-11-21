const prisma = require('../lib/prisma');
const { parsePurchase } = require('../services/purchases.service');
const { InventoryError, savePurchaseWithStock } = require('../services/inventory.service');

const createPurchase = async (req, res) => {
  let data;
  try {
    data = parsePurchase(req.body);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  try {
    // Purchase and stock changes commit together, including edits to material or unit.
    // https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions#interactive-transactions
    const purchase = await prisma.$transaction(tx => savePurchaseWithStock(tx, data, req.params.id), { isolationLevel: 'Serializable' });
    return res.status(req.params.id ? 200 : 201).json(purchase);
  } catch (error) {
    if (error instanceof InventoryError) return res.status(error.status).json({ error: error.message });
    if (['P2034', 'P2002'].includes(error.code)) return res.status(409).json({ error: 'Stock changed while saving. Refresh and try again.' });
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
