const { Prisma } = require('@prisma/client');
const PAYMENT_TYPES = ['CASH', 'NEFT', 'UPI', 'CARD', 'CHEQUE', 'OTHER'];

class LedgerValidationError extends Error {}

function parseReceipt(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new LedgerValidationError('Receipt details are required.');
  }
  const { paymentDate, paymentType, amount } = body;
  if (typeof paymentDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate) || paymentDate.startsWith('0000')) {
    throw new LedgerValidationError('Payment date must be a valid date (YYYY-MM-DD).');
  }
  const date = new Date(`${paymentDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== paymentDate) {
    throw new LedgerValidationError('Payment date must be a valid calendar date.');
  }
  if (!PAYMENT_TYPES.includes(paymentType)) throw new LedgerValidationError('Choose a valid payment type.');
  if (!['string', 'number'].includes(typeof amount) || !/^\d{1,12}(\.\d{1,2})?$/.test(String(amount))) {
    throw new LedgerValidationError('Amount must be positive with at most 12 digits and two decimal places.');
  }
  const decimal = new Prisma.Decimal(amount);
  if (!decimal.gt(0)) throw new LedgerValidationError('Amount must be greater than zero.');
  const optionalText = (key, max) => {
    const value = body[key];
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string' || value.length > max) throw new LedgerValidationError(`${key} must be text of at most ${max} characters.`);
    return value.trim() || null;
  };
  return { paymentDate: date, paymentType, amount: decimal, reference: optionalText('reference', 200), notes: optionalText('notes', 2000) };
}

function buildLedger(customer, orders, receipts) {
  const sales = orders.filter(order => order.status !== 'CANCELLED');
  // Keep money as Decimal through aggregation, per Prisma 6 fields/types docs:
  // https://www.prisma.io/docs/orm/v6/prisma-client/special-fields-and-types#working-with-decimal
  const sum = (rows, field) => rows.reduce((total, row) => total.plus(row[field]), new Prisma.Decimal(0));
  const saleTotal = sum(sales, 'totalAmount');
  const receivedTotal = sales.reduce((total, sale) => total.plus(sale.paymentStatus === 'PAID' ? sale.totalAmount : sale.amountReceived || 0), new Prisma.Decimal(0));
  return {
    customer,
    sales: sales.map(sale => ({ ...sale, totalAmount: new Prisma.Decimal(sale.totalAmount).toFixed(2) })),
    counts: { sales: sales.length, receipts: sales.filter(sale => new Prisma.Decimal(sale.paymentStatus === 'PAID' ? sale.totalAmount : sale.amountReceived || 0).gt(0)).length },
    totals: { saleAmount: saleTotal.toFixed(2), amountReceived: receivedTotal.toFixed(2), balanceReceivable: saleTotal.minus(receivedTotal).toFixed(2) },
    hasHistoricalPaymentStatuses: sales.some(sale => ['PAID', 'PARTIAL'].includes(sale.paymentStatus))
  };
}

const supplierKey = name => `supplier:${(name || '').trim().toLowerCase()}`;

function transactionLedger(customer, orders, purchases, receipts, payroll = []) {
  const base = buildLedger(customer, orders, receipts);
  const sales = orders.filter(row => row.status !== 'CANCELLED');
  const sum = (rows, field) => rows.reduce((total, row) => total.plus(row[field] || 0), new Prisma.Decimal(0));
  const received = row => row.paymentStatus === 'PAID' ? new Prisma.Decimal(row.totalAmount) : new Prisma.Decimal(row.amountReceived || 0);
  const paid = row => row.paymentStatus === 'PAID' ? new Prisma.Decimal(row.totalCost) : new Prisma.Decimal(row.amountPaid || 0);
  const saleReceipts = sales.reduce((total, row) => total.plus(received(row)), new Prisma.Decimal(0));
  const purchasePayments = purchases.reduce((total, row) => total.plus(paid(row)), new Prisma.Decimal(0));
  const purchaseTotal = sum(purchases, 'totalCost');
  const receiptTotal = saleReceipts;
  const entry = (row, kind, amount, date, party, reference) => ({ id: `${kind}:${row.id}`, kind, amount: amount.toFixed(2), date, party, reference, paymentMode: row.paymentMode || row.paymentType });
  const outflow = sales.map(row => entry(row, 'Sale', new Prisma.Decimal(row.totalAmount), row.orderDate, row.customer?.companyName || row.customer?.name || customer.name, row.orderNumber));
  const inflow = purchases.map(row => entry(row, 'Purchase', new Prisma.Decimal(row.totalCost), row.purchaseDate, row.supplier || 'Unassigned supplier', row.materialName));
  for (const row of sales) if (received(row).gt(0)) inflow.push(entry(row, 'Customer payment', received(row), row.paymentDate, row.customer?.companyName || row.customer?.name || customer.name, row.paymentReference || row.orderNumber));
  for (const row of purchases) if (paid(row).gt(0)) outflow.push(entry(row, 'Supplier payment', paid(row), row.paymentDate, row.supplier || 'Unassigned supplier', row.paymentReference || row.materialName));
  for (const row of payroll) inflow.push(entry({ ...row, id: `${row.month}:${row.employeeId}` }, 'Payroll accrued', new Prisma.Decimal(row.netPay), row.run.createdAt, row.name, `${row.month} · ${row.employeeCode}`));
  const sort = rows => rows.sort((a, b) => ((a.date ? new Date(a.date).getTime() : Infinity) - (b.date ? new Date(b.date).getTime() : Infinity)) || a.id.localeCompare(b.id));
  const outflowTotal = sum(outflow, 'amount');
  const inflowTotal = sum(inflow, 'amount');
  return { ...base, purchases, outflow: sort(outflow), inflow: sort(inflow), hasHistoricalPaymentStatuses: false,
    hasUnknownPartialPayments: sales.some(row => row.paymentStatus === 'PARTIAL' && received(row).eq(0)),
    totals: { ...base.totals, amountReceived: receiptTotal.toFixed(2), purchaseAmount: purchaseTotal.toFixed(2), amountPaid: purchasePayments.toFixed(2), payrollAccrued: sum(payroll, 'netPay').toFixed(2), balanceReceivable: new Prisma.Decimal(base.totals.saleAmount).minus(receiptTotal).toFixed(2), balancePayable: purchaseTotal.minus(purchasePayments).toFixed(2), outflow: outflowTotal.toFixed(2), inflow: inflowTotal.toFixed(2) }
  };
}

module.exports = { parseReceipt, buildLedger, transactionLedger, supplierKey, LedgerValidationError };
