const prisma = require('../lib/prisma');

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

    return res.json(products);
  } catch (error) {
    console.error('Error fetching product SKUs:', error);
    return res.json([]);
  }
};

const createProduct = async (req, res) => {
  try {
    const { skuCode, name, glassType, thicknessMm, unitOfMeasure, unitPrice, description } = req.body;

    if (!skuCode || !name || !glassType || thicknessMm === undefined || unitPrice === undefined) {
      return res.status(400).json({ error: 'Missing required product fields' });
    }

    const newProduct = await prisma.productSku.create({
      data: {
        skuCode,
        name,
        glassType,
        thicknessMm: parseFloat(thicknessMm),
        unitOfMeasure: unitOfMeasure || 'SQ_METER',
        unitPrice: parseFloat(unitPrice),
        description: description || null
      }
    });

    return res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product SKU:', error);
    return res.status(500).json({ error: 'Failed to create product SKU' });
  }
};

module.exports = {
  getProducts,
  createProduct
};
