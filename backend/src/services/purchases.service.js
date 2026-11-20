const { settlement } = require('./settlement.service');
const { Prisma } = require('@prisma/client');

const UNITS = ['PCS', 'SQ_METER', 'SQ_FEET', 'KG'];

function text(value, name, max, required = false) {
  if (value == null && !required) return null;
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) {
    throw new Error(`${name} ${required ? 'is required and ' : ''}must be text up to ${max} characters`);
  }
  return value.trim() || null;
}

function decimal(value, name, wholeDigits, places, positive = false) {
  if (!['string', 'number'].includes(typeof value) ||
      !new RegExp(`^\\d{1,${wholeDigits}}(\\.\\d{1,${places}})?$`).test(String(value))) {
    throw new Error(`${name} must be a non-negative number with up to ${places} decimal places`);
  }
  const result = new Prisma.Decimal(value);
  if (positive && result.lte(0)) throw new Error(`${name} must be greater than zero`);
  return result;
}

function parsePurchase(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Purchase fields are required');
  const materialName = text(body.materialName, 'Material name', 200, true);
  const supplier = text(body.supplier, 'Supplier', 200);
  const notes = text(body.notes, 'Notes', 2000);
  if (!UNITS.includes(body.unitOfMeasure)) throw new Error('Select a valid unit of measure');
  if (typeof body.purchaseDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.purchaseDate)) {
    throw new Error('Purchase date must use YYYY-MM-DD');
  }
  const purchaseDate = new Date(`${body.purchaseDate}T00:00:00.000Z`);
  if (!Number.isFinite(purchaseDate.getTime()) || purchaseDate.getUTCFullYear() < 1 || purchaseDate.toISOString().slice(0, 10) !== body.purchaseDate) {
    throw new Error('Purchase date is invalid');
  }
  const quantity = decimal(body.quantity, 'Quantity', 9, 3, true);
  const unitPrice = decimal(body.unitPrice, 'Unit price', 12, 2);
  const additionalCost = decimal(body.additionalCost === undefined ? 0 : body.additionalCost, 'Additional cost', 12, 2);
  // Use decimal arithmetic for money: https://www.prisma.io/docs/orm/v6/prisma-client/special-fields-and-types#working-with-decimal
  const totalCost = quantity.times(unitPrice).plus(additionalCost).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  return { materialName, supplier, notes, purchaseDate, unitOfMeasure: body.unitOfMeasure, quantity, unitPrice, additionalCost, totalCost, ...settlement(body, totalCost, 'amountPaid') , paymentMode: body.paymentMode === 'ONLINE' ? 'ONLINE' : 'CASH' };
}

module.exports = { parsePurchase };
