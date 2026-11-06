const prisma = require('../lib/prisma');

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalQuotations,
      activeQuotes,
      totalSales,
      pendingOrders,
      totalCustomers,
      totalProductSkus,
      recentQuotations,
      recentSales
    ] = await Promise.all([
      prisma.quotation.count().catch(() => 0),
      prisma.quotation.count({ where: { status: { in: ['DRAFT', 'SENT'] } } }).catch(() => 0),
      prisma.saleOrder.count().catch(() => 0),
      prisma.saleOrder.count({ where: { status: 'PENDING' } }).catch(() => 0),
      prisma.customer.count().catch(() => 0),
      prisma.productSku.count().catch(() => 0),
      prisma.quotation.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: true }
      }).catch(() => []),
      prisma.saleOrder.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: true }
      }).catch(() => [])
    ]);

    return res.json({
      kpis: {
        totalQuotations,
        activeQuotes,
        totalSales,
        pendingOrders,
        totalCustomers,
        totalProductSkus
      },
      recentQuotations,
      recentSales
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      error: 'Failed to fetch dashboard statistics',
      kpis: {
        totalQuotations: 0,
        activeQuotes: 0,
        totalSales: 0,
        pendingOrders: 0,
        totalCustomers: 0,
        totalProductSkus: 0
      },
      recentQuotations: [],
      recentSales: []
    });
  }
};

module.exports = {
  getDashboardStats
};
