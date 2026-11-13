const prisma = require('../lib/prisma');

/**
 * Generates empty baseline month periods for the last 6 months.
 */
const getMonthlyPeriods = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const now = new Date();
  const periods = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mIdx = d.getMonth();
    periods.push({
      year: d.getFullYear(),
      month: mIdx,
      period: months[mIdx],
      monthName: fullMonths[mIdx],
      glazingArea: 0,
      acceptedArea: 0,
      quotationValue: 0,
      acceptedValue: 0,
      count: 0
    });
  }

  return periods;
};

/**
 * GET /api/dashboard/stats
 * Pure DB metrics aggregation. Fail-fast error handling if database is unreachable.
 */
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalQuotations,
      totalSales,
      pendingOrders,
      totalCustomers,
      totalProductSkus,
      allQuotes,
      recentQuotations,
      recentSales
    ] = await Promise.all([
      prisma.quotation.count(),
      prisma.saleOrder.count(),
      prisma.saleOrder.count({ where: { status: 'PENDING' } }),
      prisma.customer.count(),
      prisma.productSku.count(),
      prisma.quotation.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          sections: {
            include: { items: true }
          }
        }
      }),
      prisma.quotation.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          sections: { include: { items: true } }
        }
      }),
      prisma.saleOrder.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: true }
      })
    ]);

    let totalGlazingArea = 0;
    let totalPipelineValue = 0;
    let inReviewCount = 0;
    let acceptedCount = 0;
    let draftCount = 0;

    const statusBreakdown = {
      ACCEPTED: { count: 0, areaSqM: 0, totalValue: 0 },
      SENT: { count: 0, areaSqM: 0, totalValue: 0 },
      DRAFT: { count: 0, areaSqM: 0, totalValue: 0 },
      CANCELLED: { count: 0, areaSqM: 0, totalValue: 0 }
    };

    const monthlyTrend = getMonthlyPeriods();

    allQuotes.forEach((q) => {
      const val = Number(q.totalAmount) || 0;
      totalPipelineValue += val;
      const st = (q.status || 'DRAFT').toUpperCase();
      if (st === 'SENT') inReviewCount++;
      else if (st === 'ACCEPTED') acceptedCount++;
      else if (st === 'DRAFT') draftCount++;

      let quoteArea = 0;
      (q.sections || []).forEach((sec) => {
        (sec.items || []).forEach((item) => {
          let area = Number(item.areaSqM) || 0;
          if (!area && item.areaSqFt) {
            area = Number(item.areaSqFt) * 0.092903;
          }
          if (!area && item.widthMm && item.heightMm) {
            area = (Number(item.widthMm) * Number(item.heightMm)) / 1000000;
          }
          if (!area && item.widthInches && item.heightInches) {
            area = (Number(item.widthInches) * Number(item.heightInches)) * 0.00064516;
          }
          const qty = Number(item.quantity) || 1;
          quoteArea += area * qty;
        });
      });

      totalGlazingArea += quoteArea;

      if (!statusBreakdown[st]) {
        statusBreakdown[st] = { count: 0, areaSqM: 0, totalValue: 0 };
      }
      statusBreakdown[st].count += 1;
      statusBreakdown[st].areaSqM = Number((statusBreakdown[st].areaSqM + quoteArea).toFixed(2));
      statusBreakdown[st].totalValue = Number((statusBreakdown[st].totalValue + val).toFixed(2));

      // Bucket into monthly trends
      const qDate = new Date(q.createdAt || q.issueDate);
      const qYear = qDate.getFullYear();
      const qMonth = qDate.getMonth();

      const matchedBucket = monthlyTrend.find((b) => b.year === qYear && b.month === qMonth);
      if (matchedBucket) {
        matchedBucket.count += 1;
        matchedBucket.quotationValue = Number((matchedBucket.quotationValue + val).toFixed(2));
        matchedBucket.glazingArea = Number((matchedBucket.glazingArea + quoteArea).toFixed(2));
        if (st === 'ACCEPTED') {
          matchedBucket.acceptedArea = Number((matchedBucket.acceptedArea + quoteArea).toFixed(2));
          matchedBucket.acceptedValue = Number((matchedBucket.acceptedValue + val).toFixed(2));
        }
      }
    });

    return res.json({
      kpis: {
        totalGlazingArea: parseFloat(totalGlazingArea.toFixed(2)) || 0,
        inReviewQuotes: inReviewCount,
        acceptedQuotes: acceptedCount,
        draftQuotes: draftCount,
        totalPipelineValue: Math.round(totalPipelineValue) || 0,
        totalQuotations,
        activeQuotes: inReviewCount + draftCount,
        totalSales,
        pendingOrders,
        totalCustomers,
        totalProductSkus
      },
      statusBreakdown,
      trendData: monthlyTrend.map(({ year, month, ...rest }) => rest),
      recentQuotations,
      recentSales
    });
  } catch (error) {
    console.error('Error fetching dashboard stats from database:', error.message || error);
    return res.status(500).json({ error: 'Failed to fetch dashboard metrics from database' });
  }
};

module.exports = {
  getDashboardStats
};
