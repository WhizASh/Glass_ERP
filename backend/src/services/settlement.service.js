const { Prisma } = require('@prisma/client');

class SettlementError extends Error {}

function settlement(body, total, amountField, existing = {}) {
  const status = body.paymentStatus ?? existing.paymentStatus ?? 'UNPAID';
  if (!['UNPAID', 'PARTIAL', 'PAID'].includes(status)) throw new SettlementError('Invalid payment status.');
  const raw = body[amountField] ?? existing[amountField] ?? 0;
  if (!['number', 'string'].includes(typeof raw) || !/^\d{1,22}(\.\d{1,2})?$/.test(String(raw))) throw new SettlementError('Enter a valid payment amount with at most two decimals.');
  const limit = new Prisma.Decimal(total);
  const amount = status === 'PAID' ? limit : status === 'UNPAID' ? new Prisma.Decimal(0) : new Prisma.Decimal(raw);
  if (status === 'PARTIAL' && (!amount.gt(0) || !amount.lt(limit))) throw new SettlementError('Partial payment must be greater than zero and less than the transaction total.');
  const dateText = body.paymentDate;
  let paymentDate = existing.paymentDate ?? null;
  if (dateText !== undefined) {
    paymentDate = null;
    if (dateText !== '' && dateText !== null) {
      if (typeof dateText !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateText) || dateText.startsWith('0000')) throw new SettlementError('Invalid payment date.');
      paymentDate = new Date(`${dateText}T00:00:00.000Z`);
      if (!Number.isFinite(paymentDate.getTime()) || paymentDate.toISOString().slice(0, 10) !== dateText) throw new SettlementError('Invalid payment date.');
    }
  }
  const reference = body.paymentReference ?? existing.paymentReference ?? '';
  if (typeof reference !== 'string' || reference.length > 200) throw new SettlementError('Payment reference must be text up to 200 characters.');
  return { paymentStatus: status, [amountField]: amount, paymentDate: status === 'UNPAID' ? null : paymentDate, paymentReference: reference.trim() || null };
}

module.exports = { settlement, SettlementError };
