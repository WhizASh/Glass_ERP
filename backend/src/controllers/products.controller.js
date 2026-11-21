const prisma = require('../lib/prisma');

const productData = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const { skuCode, name, glassType, thicknessMm, unitPrice, description } = body;
  const unitOfMeasure = body.unitOfMeasure ?? 'SQ_METER';
  const number = value => (typeof value === 'string' && value.trim() !== '') || typeof value === 'number';
  if (![skuCode, name, glassType].every(value => typeof value === 'string' && value.trim()) ||
      !['SQ_METER', 'SQ_FEET', 'SQ_FT', 'KG', 'PCS'].includes(unitOfMeasure) ||
      !number(thicknessMm) || !Number.isFinite(Number(thicknessMm)) || Number(thicknessMm) < 1 ||
      !number(unitPrice) || !Number.isFinite(Number(unitPrice)) || Number(unitPrice) < 0 ||
      (description != null && typeof description !== 'string')) return null;
  return {
    skuCode: skuCode.trim(), name: name.trim(), glassType: glassType.trim(),
    thicknessMm: Number(thicknessMm), unitOfMeasure, unitPrice: Number(unitPrice),
    description: description?.trim() || null
  };
};

// Prisma 6 error codes: https://www.prisma.io/docs/orm/v6/reference/error-reference
const productError = (res, error, action) => {
  if (error.code === 'P2002') return res.status(409).json({ error: 'A product with this SKU code already exists.' });
  if (error.code === 'P2025') return res.status(404).json({ error: 'Product SKU not found.' });
  if (error.code === 'P2003') return res.status(409).json({ error: 'This product is used in a quotation or sales order and cannot be deleted.' });
  if (error.code === 'P2034') return res.status(409).json({ error: 'The product changed during this request. Please refresh and try again.' });
  console.error(`Error ${action} product SKU:`, error.message || error);
  return res.status(500).json({ error: `Failed to ${action} product SKU.` });
};

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
    const data = productData(req.body);
    if (!data) return res.status(400).json({ error: 'Enter valid product fields, thickness of at least 1 mm, and a non-negative price.' });
    const newProduct = await prisma.productSku.create({ data });

    return res.status(201).json(normalizeProduct(newProduct));
  } catch (error) {
    return productError(res, error, 'create');
  }
};

const updateProduct = async (req, res) => {
  try {
    const data = productData(req.body);
    if (!data) return res.status(400).json({ error: 'Enter valid product fields, thickness of at least 1 mm, and a non-negative price.' });
    const product = await prisma.$transaction(async tx => {
      const previous = await tx.productSku.findUnique({ where: { id: req.params.id } });
      if (!previous) throw Object.assign(new Error('Product SKU not found.'), { code: 'P2025' });
      if (previous.name !== data.name || previous.glassType !== data.glassType || Number(previous.thicknessMm) !== data.thicknessMm) {
        // Older quotation lines may lack a saved specification. Capture it before changing the catalog.
        await tx.quotationItem.updateMany({
          where: { productSkuId: previous.id, OR: [{ description: null }, { description: '' }] },
          data: { description: `${previous.name} (${Number(previous.thicknessMm)}mm - ${previous.glassType})` }
        });
      }
      return tx.productSku.update({ where: { id: req.params.id }, data });
    }, { isolationLevel: 'Serializable' });
    return res.json(normalizeProduct(product));
  } catch (error) { return productError(res, error, 'update'); }
};

const deleteProduct = async (req, res) => {
  try {
    // Delete only unused catalog records, including sales links whose FK allows SET NULL.
    // https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions#interactive-transactions
    const result = await prisma.$transaction(async tx => {
      const deleted = await tx.productSku.deleteMany({
        where: { id: req.params.id, quoteItems: { none: {} }, saleItems: { none: {} } }
      });
      if (deleted.count) return 200;
      const existing = await tx.productSku.findUnique({ where: { id: req.params.id }, select: { id: true } });
      return existing ? 409 : 404;
    }, { isolationLevel: 'Serializable' });
    if (result === 409) return res.status(409).json({ error: 'This product is used in a quotation or sales order and cannot be deleted.' });
    if (result === 404) return res.status(404).json({ error: 'Product SKU not found.' });
    return res.json({ message: 'Product SKU deleted.' });
  } catch (error) { return productError(res, error, 'delete'); }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
