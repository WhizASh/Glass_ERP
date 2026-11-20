const prisma = require('../lib/prisma');
const { calculateItemSqft, calculateDiscount } = require('../services/glassCalculations.service');

const include = { saleOrder: { select: { id: true, orderNumber: true } } };
const present = invoice => ({ ...invoice, invoiceNumber: `TI-${String(invoice.number).padStart(6, '0')}` });
const fail = (res, error) => res.status(500).json({ error: 'Unable to save or load tax invoices' });

function prepare(input, customer) {
  const items = input.items;
  if (!Array.isArray(items) || !items.length) throw new Error('At least one glass item is required');
  const normalized = items.map((item, index) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const widthInches = item.widthInches === '' || item.widthInches == null ? null : Number(item.widthInches);
    const heightInches = item.heightInches === '' || item.heightInches == null ? null : Number(item.heightInches);
    const areaSqFt = Number(item.areaSqFt) || 0;
    if (!String(item.sectionName || '').trim() || !String(item.description || '').trim() || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0 || (widthInches !== null && (!Number.isFinite(widthInches) || widthInches <= 0)) || (heightInches !== null && (!Number.isFinite(heightInches) || heightInches <= 0))) throw new Error(`Invalid glass item ${index + 1}`);
    const sqft = widthInches && heightInches ? calculateItemSqft(widthInches, heightInches) : areaSqFt;
    if (!Number.isFinite(sqft) || sqft <= 0) throw new Error(`Glass item ${index + 1} needs dimensions or an area`);
    return { sectionName: String(item.sectionName).trim(), description: String(item.description).trim(), productSkuId: item.productSkuId || null, widthInches, heightInches, areaSqFt: sqft, quantity, unitPrice, totalPrice: Number((sqft * quantity * unitPrice).toFixed(2)) };
  });
  const discountType = input.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
  const discountValue = Number(input.discountValue) || 0;
  const taxRate = Number(input.taxRate) || 0;
  if (discountValue < 0 || taxRate < 0 || taxRate > 100 || (discountType === 'PERCENTAGE' && discountValue > 100)) throw new Error('Invalid discount or tax rate');
  const subtotal = Number(normalized.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2));
  const discountAmount = calculateDiscount(subtotal, discountType, discountValue);
  const taxableAmount = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));
  const taxAmount = Number((taxableAmount * taxRate / 100).toFixed(2));
  return { customer: { name: customer.name, companyName: customer.companyName, address: customer.address, city: customer.city, taxId: customer.taxId }, items: normalized, discountType, discountValue, discountAmount, taxRate, taxAmount, subtotal, taxableAmount, totalAmount: Number((taxableAmount + taxAmount).toFixed(2)), notes: String(input.notes || '') };
}

exports.list = async (_req, res) => {
  try { res.json((await prisma.taxInvoice.findMany({ orderBy: { number: 'desc' }, include })).map(present)); }
  catch (error) { console.error(error); fail(res, error); }
};
exports.create = async (req, res) => {
  try {
    const saleOrder = await prisma.saleOrder.findUnique({ where: { id: req.body.saleOrderId }, include: { customer: true, items: true } });
    if (!saleOrder) return res.status(404).json({ error: 'Sale order not found' });
    const customer = await prisma.customer.findUnique({ where: { id: req.body.customerId || saleOrder.customerId } });
    if (!customer) return res.status(400).json({ error: 'Customer not found' });
    const sourceItems = saleOrder.items.map(item => ({ ...item, sectionName: item.sectionName || 'Section 1' }));
    const data = prepare({ ...req.body, items: req.body.items || sourceItems, discountType: req.body.discountType ?? saleOrder.discountType, discountValue: req.body.discountValue ?? saleOrder.discountValue, taxRate: req.body.taxRate ?? saleOrder.taxRate }, customer);
    const invoice = await prisma.taxInvoice.create({ data: { saleOrderId: saleOrder.id, customerId: customer.id, issueDate: req.body.issueDate ? new Date(req.body.issueDate) : new Date(), data }, include });
    res.status(201).json(present(invoice));
  } catch (error) { if (error.message.startsWith('Invalid') || error.message.startsWith('At least') || error.message.startsWith('Glass item')) return res.status(400).json({ error: error.message }); console.error(error); fail(res, error); }
};
exports.update = async (req, res) => {
  try {
    const current = await prisma.taxInvoice.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: 'Tax invoice not found' });
    const customer = await prisma.customer.findUnique({ where: { id: req.body.customerId || current.customerId } });
    if (!customer) return res.status(400).json({ error: 'Customer not found' });
    const data = prepare(req.body, customer.id === current.customerId ? current.data.customer : customer);
    const invoice = await prisma.taxInvoice.update({ where: { id: current.id }, data: { customerId: customer.id, issueDate: req.body.issueDate ? new Date(req.body.issueDate) : current.issueDate, data }, include });
    res.json(present(invoice));
  } catch (error) { if (error.message.startsWith('Invalid') || error.message.startsWith('At least') || error.message.startsWith('Glass item')) return res.status(400).json({ error: error.message }); console.error(error); fail(res, error); }
};
