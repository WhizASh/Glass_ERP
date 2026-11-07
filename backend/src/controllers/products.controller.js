const prisma = require('../lib/prisma');

const defaultProducts = [
  {
    id: 'prod-gl-12mm-clear',
    skuCode: 'GL-TOUGH-12MM',
    name: '12mm Clear Toughened Architectural Glass',
    glassType: 'Toughened',
    thicknessMm: 12,
    unitOfMeasure: 'SQ_FT',
    unitPrice: 185.00,
    description: '12mm High Precision Float Glass with Polished Edges for Facades'
  },
  {
    id: 'prod-gl-10mm-clear',
    skuCode: 'GL-TOUGH-10MM',
    name: '10mm Clear Toughened Architectural Glass',
    glassType: 'Toughened',
    thicknessMm: 10,
    unitOfMeasure: 'SQ_FT',
    unitPrice: 155.00,
    description: '10mm Toughened Glass for Partitions and Windows'
  },
  {
    id: 'prod-gl-12mm-frosted',
    skuCode: 'GL-FROST-12MM',
    name: '12mm Acid Etched / Frosted Glass',
    glassType: 'Frosted / Acid Etched',
    thicknessMm: 12,
    unitOfMeasure: 'SQ_FT',
    unitPrice: 215.00,
    description: '12mm Privacy Glazing for Office Cabins & Partitions'
  },
  {
    id: 'prod-gl-8mm-clear',
    skuCode: 'GL-TOUGH-8MM',
    name: '8mm Clear Toughened Glass',
    glassType: 'Toughened',
    thicknessMm: 8,
    unitOfMeasure: 'SQ_FT',
    unitPrice: 130.00,
    description: '8mm Toughened Glazing for Internal Fitouts'
  }
];

let inMemoryProducts = [...defaultProducts];

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

    if (products && products.length > 0) {
      return res.json(products);
    }
    return res.json(inMemoryProducts);
  } catch (error) {
    console.warn('DB offline, returning in-memory product catalog:', error.message || error);
    return res.json(inMemoryProducts);
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
        unitOfMeasure: unitOfMeasure || 'SQ_FT',
        unitPrice: parseFloat(unitPrice),
        description: description || null
      }
    });

    inMemoryProducts.unshift(newProduct);
    return res.status(201).json(newProduct);
  } catch (error) {
    console.warn('Prisma error creating product SKU, using in-memory catalog fallback:', error.message || error);
    const fallbackProduct = {
      id: 'prod-' + Date.now(),
      skuCode: req.body.skuCode || `GL-${Date.now().toString().slice(-4)}`,
      name: req.body.name,
      glassType: req.body.glassType || 'Toughened',
      thicknessMm: parseFloat(req.body.thicknessMm) || 12,
      unitOfMeasure: req.body.unitOfMeasure || 'SQ_FT',
      unitPrice: parseFloat(req.body.unitPrice) || 0,
      description: req.body.description || null,
      createdAt: new Date().toISOString()
    };
    inMemoryProducts.unshift(fallbackProduct);
    return res.status(201).json(fallbackProduct);
  }
};

module.exports = {
  getProducts,
  createProduct,
  inMemoryProducts,
  defaultProducts
};
