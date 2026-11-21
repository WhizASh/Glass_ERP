const prisma = require('../lib/prisma');
const { InventoryError, parseInventory, parseRevision } = require('../services/inventory.service');

function fail(res, error) {
  if (error instanceof InventoryError) return res.status(error.status).json({ error: error.message });
  if (error.code === 'P2002') return res.status(409).json({ error: 'This material and unit already exist. Edit the existing inventory item.' });
  if (error.code === 'P2034') return res.status(409).json({ error: 'Stock changed while saving. Reload inventory and try again.' });
  if (error.code === 'P2025') return res.status(404).json({ error: 'Inventory item not found.' });
  if (error.code === 'P2003') return res.status(409).json({ error: 'This item has linked purchases and cannot be deleted.' });
  console.error('Inventory request failed:', error.code || error.name);
  return res.status(500).json({ error: 'Unable to update or load inventory. Please try again.' });
}

async function getInventory(req, res) {
  const { q = '', page = '1' } = req.query;
  if (typeof q !== 'string' || q.length > 200 || typeof page !== 'string' || !/^[1-9]\d{0,5}$/.test(page)) {
    return res.status(400).json({ error: 'Invalid inventory search or page.' });
  }
  const where = q.trim() ? { materialName: { contains: q.trim(), mode: 'insensitive' } } : {};
  try {
    const pageSize = 25;
    const [records, total] = await prisma.$transaction([
      prisma.inventoryItem.findMany({ where, include: { _count: { select: { purchases: true } } }, orderBy: [{ materialName: 'asc' }, { id: 'asc' }], skip: (Number(page) - 1) * pageSize, take: pageSize }),
      prisma.inventoryItem.count({ where })
    ], { isolationLevel: 'RepeatableRead' });
    return res.json({ records, total, page: Number(page), pageSize });
  } catch (error) { return fail(res, error); }
}

async function saveInventory(req, res) {
  try {
    const data = parseInventory(req.body);
    if (!req.params.id) return res.status(201).json(await prisma.inventoryItem.create({ data }));
    const revision = parseRevision(req.body.revision);
    const saved = await prisma.$transaction(async tx => {
      const previous = await tx.inventoryItem.findUnique({ where: { id: req.params.id }, include: { _count: { select: { purchases: true } } } });
      if (!previous) throw new InventoryError('Inventory item not found.', 404);
      if (previous.revision !== revision) throw new InventoryError('Stock changed since you opened this item. Close this dialog and reload inventory.', 409);
      if (previous._count.purchases && (data.nameKey !== previous.nameKey || data.unitOfMeasure !== previous.unitOfMeasure)) {
        throw new InventoryError('Change the material or unit in its purchase records so stock stays linked correctly.', 409);
      }
      return tx.inventoryItem.update({ where: { id: previous.id }, data: { ...data, revision: { increment: 1 } } });
    }, { isolationLevel: 'Serializable' });
    return res.json(saved);
  } catch (error) { return fail(res, error); }
}

async function deleteInventory(req, res) {
  try {
    const revision = parseRevision(req.body?.revision);
    await prisma.$transaction(async tx => {
      const item = await tx.inventoryItem.findUnique({ where: { id: req.params.id }, include: { _count: { select: { purchases: true } } } });
      if (!item) throw new InventoryError('Inventory item not found.', 404);
      if (item.revision !== revision) throw new InventoryError('Stock changed. Close this dialog and reload inventory before deleting.', 409);
      if (item._count.purchases) throw new InventoryError('Items linked to purchases cannot be deleted. Edit the quantity to record used or unavailable stock.', 409);
      await tx.inventoryItem.delete({ where: { id: item.id } });
    }, { isolationLevel: 'Serializable' });
    return res.json({ deleted: true });
  } catch (error) { return fail(res, error); }
}

module.exports = { getInventory, saveInventory, deleteInventory };
