// Dashboard Controller
const dashboardService = require("../services/dashboardService");

async function getSummary(req, res, next) {
  try {
    const summary = await dashboardService.getSummary();
    res.json({
      success: true,
      data: summary.kpis
    });
  } catch (error) {
    next(error);
  }
}

async function getSalesChart(req, res, next) {
  try {
    const { period = "month" } = req.query;
    const chartData = await dashboardService.getSalesChart(period);
    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    next(error);
  }
}

async function getTopProduce(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const topProduce = await dashboardService.getTopProducedMaterials(limit);
    res.json({
      success: true,
      data: topProduce
    });
  } catch (error) {
    next(error);
  }
}

async function getRecentActivity(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const activity = await dashboardService.getRecentActivity(limit);
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSummary,
  getSalesChart,
  getTopProduce,
  getRecentActivity
};
