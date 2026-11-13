const prisma = require('../lib/prisma');

const normalizeProduct = (prod) => {
  if (!prod) return null;
  return {
    ...prod,
    thicknessMm: Number(prod.thicknessMm) || 0,
    unitPrice: Number(prod.unitPrice) || 0
  };
};

/**
 * GET /api/products
 * Pure DB fetch with filtering by glassType and text search.
 */
const getProducts = async (req, res) => {
  try {
    const { q, glassType } = req.query;
    const where = {};

    if (glassType) {
      where.glassType = { contains: glassType, mode: 'insensitive' };
    }

    if (q) {
      where.OR = [
        { skuCode: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { glassType: { contains: q, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.productSku.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return res.json(products.map(normalizeProduct));
  } catch (error) {
    console.error('Error fetching products from database:', error.message || error);
    return res.status(500).json({ error: 'Failed to fetch product catalog from database' });
  }
};

/**
 * POST /api/products
 * Creates a product SKU directly in PostgreSQL via Prisma.
 */
const createProduct = async (req, res) => {
  try {
    const { skuCode, name, glassType, thicknessMm, unitOfMeasure, unitPrice, description } = req.body;

    if (!skuCode || !name || !glassType || thicknessMm === undefined || unitPrice === undefined) {
      return res.status(400).json({ error: 'Missing required product fields' });
    }

    const newProduct = await prisma.productSku.create({
      data: {
        skuCode: skuCode.trim(),
        name: name.trim(),
        glassType: glassType.trim(),
        thicknessMm: parseFloat(thicknessMm),
        unitOfMeasure: unitOfMeasure || 'SQ_FT',
        unitPrice: parseFloat(unitPrice),
        description: description ? description.trim() : null
      }
    });

    return res.status(201).json(normalizeProduct(newProduct));
  } catch (error) {
    console.error('Error creating product SKU in database:', error.message || error);
    return res.status(500).json({ error: 'Failed to create product SKU in database' });
  }
};

module.exports = {
  getProducts,
  createProduct
};
