// Dashboard Routes
const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

router.get("/summary", dashboardController.getSummary);
router.get("/sales-chart", dashboardController.getSalesChart);
router.get("/top-produce", dashboardController.getTopProduce);
router.get("/recent-activity", dashboardController.getRecentActivity);

module.exports = router;
