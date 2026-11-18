const express = require("express");
const router = express.Router();
const revenueController = require("../controllers/revenueController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/analytics/summary", authMiddleware, revenueController.getAnalyticsSummary);
router.get("/analytics/daily", authMiddleware, revenueController.getDailyRevenue);
router.get("/analytics/monthly", authMiddleware, revenueController.getMonthlyRevenue);
router.get("/analytics/category", authMiddleware, revenueController.getCategoryRevenue);
router.get("/analytics/items", authMiddleware, revenueController.getItemRevenue);
router.get("/analytics/payments", authMiddleware, revenueController.getPaymentAnalytics);

module.exports = router;
