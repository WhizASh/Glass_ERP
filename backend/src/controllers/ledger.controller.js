const prisma = require('../lib/prisma');
const { parseReceipt, transactionLedger, supplierKey, LedgerValidationError } = require('../services/ledger.service');

const getParties = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({ select: { id: true, name: true, companyName: true }, orderBy: { name: 'asc' } });
    const suppliers = await prisma.purchase.findMany({ select: { supplier: true }, distinct: ['supplier'] });
    const employees = await prisma.employee.findMany({ select: { id: true, name: true, employeeCode: true }, orderBy: { name: 'asc' } });
    const grouped = new Map(suppliers.map(row => [supplierKey(row.supplier), { id: supplierKey(row.supplier), name: row.supplier?.trim() || 'Unassigned supplier', type: 'Supplier' }]));
    return res.json([...customers.map(row => ({ ...row, type: 'Customer' })), ...grouped.values(), ...employees.map(row => ({ ...row, id: `employee:${row.id}`, type: 'Employee' }))]);
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load parties. Please try again.' });
  }
};

const getLedger = async (req, res) => {
  const id = req.params.customerId || 'all';
  const all = id === 'all';
  const supplier = id.startsWith('supplier:');
  const employee = id.startsWith('employee:');
  try {
    // https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions#transaction-isolation-level
    const ledger = await prisma.$transaction(async tx => {
      const employeeRecord = employee ? await tx.employee.findUnique({ where: { id: id.slice(9) }, select: { name: true, employeeCode: true } }) : null;
      const customer = all ? { id, name: 'All parties', type: 'All' } : supplier ? { id, name: id.slice(9) || 'Unassigned supplier', type: 'Supplier' } : employee ? (employeeRecord && { ...employeeRecord, id, type: 'Employee' }) : await tx.customer.findUnique({ where: { id }, select: { id: true, name: true, companyName: true, phone: true, city: true } });
      if (!customer) return null;
      const sales = supplier || employee ? [] : await tx.saleOrder.findMany({
        where: { ...(all ? {} : { customerId: id }), status: { not: 'CANCELLED' } },
        include: { customer: { select: { name: true, companyName: true } }, quotation: { select: { quoteNumber: true } } },
        orderBy: [{ orderDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }]
      });
      let purchases = all || supplier ? await tx.purchase.findMany({ orderBy: [{ purchaseDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }] }) : [];
      if (supplier) purchases = purchases.filter(row => supplierKey(row.supplier) === id);
      if (supplier && purchases.length) customer.name = purchases[0].supplier || 'Unassigned supplier';
      const payroll = all || employee ? await tx.payrollEntry.findMany({ where: employee ? { employeeId: id.slice(9) } : {}, include: { run: { select: { createdAt: true } } }, orderBy: [{ month: 'asc' }, { employeeId: 'asc' }] }) : [];
      return transactionLedger(customer, sales, purchases, [], payroll);
    }, { isolationLevel: 'RepeatableRead' });
    if (!ledger) return res.status(404).json({ error: 'Customer not found.' });
    return res.json(ledger);
  } catch (error) {
    console.error('Error loading ledger:', error.message);
    return res.status(500).json({ error: 'Unable to load ledger. Please try again.' });
  }
};

const createReceipt = async (req, res) => {
  try {
    const data = parseReceipt(req.body);
    const customer = await prisma.customer.findUnique({ where: { id: req.params.customerId }, select: { id: true } });
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });
    if (typeof req.body.saleOrderId !== 'string' || req.body.saleOrderId.length > 100) throw new LedgerValidationError('Select a sale to apply this payment to.');
    {
      const result = await prisma.$transaction(async tx => {
        const sale = await tx.saleOrder.findUnique({ where: { id: req.body.saleOrderId } });
        if (!sale || sale.customerId !== customer.id || sale.status === 'CANCELLED' || sale.isLocked) throw new LedgerValidationError('Select an unlocked, active sale for this customer.');
        const { Prisma } = require('@prisma/client');
        const amount = new Prisma.Decimal(sale.paymentStatus === 'PAID' ? sale.totalAmount : sale.amountReceived || 0).plus(data.amount);
        if (amount.gt(sale.totalAmount)) throw new LedgerValidationError('Receipt exceeds the outstanding sale amount.');
        return tx.saleOrder.update({ where: { id: sale.id }, data: { amountReceived: amount, paymentStatus: amount.eq(sale.totalAmount) ? 'PAID' : 'PARTIAL', paymentDate: data.paymentDate, paymentReference: data.reference, paymentMode: data.paymentType === 'CASH' ? 'CASH' : 'ONLINE' } });
      }, { isolationLevel: 'Serializable' });
      return res.status(201).json(result);
    }
  } catch (error) {
    if (error instanceof LedgerValidationError) return res.status(400).json({ error: error.message });
    if (error.code === 'P2034') return res.status(409).json({ error: 'This sale changed while saving. Refresh and try again.' });
    if (error.code === 'P2003') return res.status(404).json({ error: 'Customer not found.' });
    console.error('Error recording receipt:', error.message);
    return res.status(500).json({ error: 'Unable to record receipt. Please try again.' });
  }
};

module.exports = { getParties, getLedger, createReceipt };
