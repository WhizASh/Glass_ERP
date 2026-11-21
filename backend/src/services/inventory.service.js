const { Prisma } = require('@prisma/client');

const UNITS = ['PCS', 'SQ_METER', 'SQ_FEET', 'KG'];
const MAX_QUANTITY = new Prisma.Decimal('999999999999999.999');
const materialKey = name => name.trim().replace(/\s+/g, ' ').toLowerCase();

class InventoryError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

function parseRevision(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new InventoryError('Reload inventory before saving this change.');
  return value;
}

function parseInventory(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new InventoryError('Inventory details are required.');
  if (typeof body.materialName !== 'string' || !body.materialName.trim() || body.materialName.trim().length > 200) {
    throw new InventoryError('Material name is required and must be at most 200 characters.');
  }
  if (!UNITS.includes(body.unitOfMeasure)) throw new InventoryError('Select a valid unit of measure.');
  if (!['string', 'number'].includes(typeof body.quantity) || !/^\d{1,15}(\.\d{1,3})?$/.test(String(body.quantity))) {
    throw new InventoryError('Quantity must be non-negative, with up to 15 digits and three decimal places.');
  }
  if (body.notes != null && (typeof body.notes !== 'string' || body.notes.length > 2000)) throw new InventoryError('Notes must be at most 2000 characters.');
  return {
    materialName: body.materialName.trim().replace(/\s+/g, ' '), nameKey: materialKey(body.materialName),
    unitOfMeasure: body.unitOfMeasure, quantity: new Prisma.Decimal(body.quantity), notes: body.notes?.trim() || null
  };
}

async function changeStock(tx, id, delta) {
  if (delta.isZero()) return;
  // Atomic numeric updates prevent a purchase from overwriting a manual stock edit.
  // https://www.prisma.io/docs/orm/v6/prisma-client/queries/crud#update-a-number-field
  const quantity = delta.isNegative() ? { gte: delta.abs() } : { lte: MAX_QUANTITY.minus(delta) };
  const result = await tx.inventoryItem.updateMany({
    where: { id, quantity }, data: { quantity: { increment: delta }, revision: { increment: 1 } }
  });
  if (!result.count) throw new InventoryError('This purchase change would make stock negative or exceed its limit. Review the inventory quantity first.', 409);
}

async function savePurchaseWithStock(tx, data, id) {
  const previous = id ? await tx.purchase.findUnique({ where: { id } }) : null;
  if (id && !previous) throw new InventoryError('Purchase not found.', 404);
  const item = await tx.inventoryItem.upsert({
    where: { nameKey_unitOfMeasure: { nameKey: materialKey(data.materialName), unitOfMeasure: data.unitOfMeasure } },
    create: { materialName: data.materialName.trim().replace(/\s+/g, ' '), nameKey: materialKey(data.materialName), unitOfMeasure: data.unitOfMeasure },
    update: {}
  });
  if (previous?.inventoryItemId === item.id) {
    await changeStock(tx, item.id, new Prisma.Decimal(data.quantity).minus(previous.quantity));
  } else {
    if (previous) await changeStock(tx, previous.inventoryItemId, new Prisma.Decimal(previous.quantity).negated());
    await changeStock(tx, item.id, new Prisma.Decimal(data.quantity));
  }
  const purchase = { ...data, inventoryItemId: item.id };
  return id ? tx.purchase.update({ where: { id }, data: purchase }) : tx.purchase.create({ data: purchase });
}

module.exports = { InventoryError, parseInventory, parseRevision, savePurchaseWithStock, materialKey };
