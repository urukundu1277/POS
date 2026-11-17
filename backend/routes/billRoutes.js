const express = require("express");
const router = express.Router();
const billController = require("../controllers/billController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, billController.createBill);
router.get("/", authMiddleware, billController.getBills);
router.get("/:id", authMiddleware, billController.getBill);
router.get("/analytics/category-sales", authMiddleware, billController.getCategorySales);
router.get("/analytics/daily-sales", authMiddleware, billController.getDailySales);

module.exports = router;
