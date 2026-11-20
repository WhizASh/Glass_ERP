/** Additive demo fixtures. Never deletes or overwrites existing records. */
const { calculateItemSqft, roundDimensionTo6Inches, calculateQuotationTotals } = require('../src/services/glassCalculations.service');
const { settlement } = require('../src/services/settlement.service');

const money = value => Number(value.toFixed(2));

function buildDemoData(today = new Date()) {
  const day = offset => {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    date.setUTCDate(date.getUTCDate() + offset);
    return date;
  };
  const customers = [
    { id: 'demo-customer-facades', name: 'Aarav Shah', companyName: 'Demo Skyline Facades', city: 'Nagpur' },
    { id: 'demo-customer-interiors', name: 'Meera Joshi', companyName: 'Demo Studio Interiors', city: 'Pune' },
    { id: 'demo-customer-home', name: 'Demo Rohan Deshmukh', customerType: 'INDIVIDUAL', city: 'Mumbai' }
  ].map((customer, index) => ({ customerType: 'ORGANIZATION', ...customer,
    email: `glass-erp-demo-${index + 1}@example.invalid`, address: `${index + 1} Demo Street`, notes: 'Demo data only.' }));
  const products = [
    ['clear-12', '12mm clear toughened glass', 'Toughened', 12, 185],
    ['clear-10', '10mm clear toughened glass', 'Toughened', 10, 155],
    ['frosted-8', '8mm frosted glass', 'Frosted', 8, 165],
    ['laminated-12', '12mm laminated glass', 'Laminated', 12, 240]
  ].map(([key, name, glassType, thicknessMm, unitPrice]) => ({
    id: `demo-product-${key}`, skuCode: `DEMO-${key.toUpperCase()}`, name, glassType,
    thicknessMm, unitPrice, unitOfMeasure: 'SQ_FT', description: 'Demo catalog item; rate per square foot.'
  }));
  const scenarios = [
    { status: 'ACCEPTED', paymentStatus: 'PAID', saleStatus: 'DELIVERED', customer: 0 },
    { status: 'ACCEPTED', paymentStatus: 'PARTIAL', saleStatus: 'PENDING', customer: 1 },
    { status: 'ACCEPTED', paymentStatus: 'UNPAID', saleStatus: 'PENDING', customer: 0 },
    { status: 'SENT', customer: 2 },
    { status: 'DRAFT', customer: 1 }
  ];
  const quotations = [];
  const sales = [];
  scenarios.forEach((scenario, index) => {
    const key = index + 1;
    const items = [0, 1].map((itemIndex) => {
      const product = products[(index + itemIndex) % products.length];
      const widthInches = itemIndex === 0 ? 57 : 35.5;
      const heightInches = itemIndex === 0 ? 44 : 24;
      const quantity = key + itemIndex;
      const areaSqFt = calculateItemSqft(widthInches, heightInches);
      return { productSkuId: product.id, description: product.name, widthInches, heightInches,
        areaSqFt, quantity, unitPrice: product.unitPrice, totalPrice: money(areaSqFt * quantity * product.unitPrice) };
    });
    const pricing = calculateQuotationTotals({
      subtotal: items.reduce((sum, item) => sum + item.totalPrice, 0),
      discountType: index === 1 ? 'FIXED' : 'PERCENTAGE', discountValue: index === 1 ? 500 : 5, taxRate: 18
    });
    const customer = customers[scenario.customer];
    const quotationId = `demo-quotation-${key}`;
    quotations.push({ id: quotationId, quoteNumber: `DEMO-Q-${String(key).padStart(3, '0')}`,
      customerId: customer.id, status: scenario.status, issueDate: day(-10 + index), validUntil: day(20 + index),
      ...pricing, notes: 'Demo quotation — six-inch billing grid, discount before GST.',
      sections: { create: [{ id: `demo-section-${key}`, sectionName: 'Ground floor glazing', sortOrder: 0,
        items: { create: items.map((item, itemIndex) => ({ ...item, id: `demo-quote-item-${key}-${itemIndex}`,
          roundedWidthInches: roundDimensionTo6Inches(item.widthInches),
          roundedHeightInches: roundDimensionTo6Inches(item.heightInches),
          areaSqM: Number((item.areaSqFt * 0.092903).toFixed(4)) })) } }] }
    });
    if (scenario.saleStatus) {
      const paid = scenario.paymentStatus !== 'UNPAID';
      sales.push({ id: `demo-sale-${key}`, orderNumber: `DEMO-SO-${String(key).padStart(3, '0')}`,
        customerId: customer.id, quotationId, status: scenario.saleStatus,
        ...pricing, ...settlement({ paymentStatus: scenario.paymentStatus,
          amountReceived: money(pricing.totalAmount / 2), paymentDate: paid ? day(-3).toISOString().slice(0, 10) : null,
          paymentReference: paid ? `DEMO-PAYMENT-${key}` : '' }, pricing.totalAmount, 'amountReceived'),
        paymentMode: 'ONLINE', orderDate: day(-7 + index), deliveryAddress: customer.address,
        isLocked: scenario.paymentStatus === 'PAID',
        items: { create: items.map((item, itemIndex) => ({ ...item, id: `demo-sale-item-${key}-${itemIndex}`, sectionName: 'Ground floor glazing' })) }
      });
    }
  });
  const purchases = ['PAID', 'PARTIAL', 'UNPAID'].map((paymentStatus, index) => {
    const quantity = (index + 1) * 10;
    const unitPrice = 950 + index * 200;
    const totalCost = quantity * unitPrice + 500;
    const paid = paymentStatus !== 'UNPAID';
    return { id: `demo-purchase-${index + 1}`, materialName: `Demo ${[12, 10, 8][index]}mm glass sheets`,
      supplier: index === 2 ? 'Demo Crystal Glass Supply' : 'Demo Central Glass Traders',
      purchaseDate: day(-12 + index), unitOfMeasure: 'PCS', quantity, unitPrice, additionalCost: 500, totalCost,
      ...settlement({ paymentStatus, amountPaid: money(totalCost / 2),
        paymentDate: paid ? day(-5).toISOString().slice(0, 10) : null,
        paymentReference: paid ? `DEMO-SUPPLIER-PAY-${index + 1}` : '' }, totalCost, 'amountPaid'),
      paymentMode: 'ONLINE', notes: 'Demo material purchase.' };
  });
  const employees = [
    ['operator', 'Demo Vikram Patil', 'Glass cutting operator', 24000],
    ['accounts', 'Demo Anika Rao', 'Accounts assistant', 28000],
    ['installer', 'Demo Sameer Khan', 'Installation technician', 26000]
  ].map(([key, name, role, amount], index) => ({ id: `demo-employee-${key}`,
    employeeCode: `DEMO-EMP-00${index + 1}`, name, role, address: 'Demo staff address', joinedOn: day(-90),
    salaries: { create: [{ effectiveOn: day(-90), amount }] } }));
  return { customer: customers, productSku: products, quotation: quotations, saleOrder: sales,
    purchase: purchases, employee: employees };
}

async function seedDemo(prisma, data = buildDemoData()) {
  // Prisma Client 6 interactive transaction: all fixtures commit or all roll back.
  // https://www.prisma.io/docs/orm/prisma-client/queries/transactions#interactive-transactions
  return prisma.$transaction(async tx => {
    const summary = {};
    for (const [model, records] of Object.entries(data)) {
      summary[model] = { created: 0, skipped: 0 };
      for (const record of records) {
        const existing = await tx[model].findUnique({ where: { id: record.id }, select: { id: true } });
        if (existing) {
          summary[model].skipped++;
        } else {
          await tx[model].create({ data: record });
          summary[model].created++;
        }
      }
    }
    return summary;
  }, { maxWait: 10000, timeout: 60000, isolationLevel: 'Serializable' });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--dry-run', '--help'].includes(arg))) throw new Error('Unknown option. Use --help.');
  if (args.includes('--help')) {
    console.log('Usage: npm run db:seed -- [--dry-run]\nAdds demo data without deleting or updating existing records.\nUses backend/.env. --dry-run previews fixtures without connecting to the database.');
    return;
  }
  const data = buildDemoData();
  if (args.includes('--dry-run')) {
    console.table(Object.fromEntries(Object.entries(data).map(([model, records]) => [model, { records: records.length }])));
    console.table(data.saleOrder.map(sale => ({ order: sale.orderNumber, total: sale.totalAmount,
      paymentStatus: sale.paymentStatus, received: sale.amountReceived.toString() })));
    console.log('Preview only. No database connection or writes.');
    return;
  }
  require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing. Configure backend/.env first.');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    console.table(await seedDemo(prisma, data));
    console.log('Demo data ready. Ledger entries are derived automatically from sales and purchases.');
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) main().catch(error => {
  // Do not print connection strings or full Prisma invocation errors.
  console.error(`Demo seed failed (${error.code || error.name}). ${error.code ? 'Check migrations, database access and conflicting demo identifiers.' : 'Use --help and check backend/.env.'}`);
  process.exitCode = 1;
});

module.exports = { buildDemoData, seedDemo };
