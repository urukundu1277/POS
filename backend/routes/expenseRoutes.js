const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, expenseController.createExpense);
router.get("/", authMiddleware, expenseController.getExpenses);
router.get("/summary", authMiddleware, expenseController.getExpenseSummary);
router.get("/:id", authMiddleware, expenseController.getExpense);
router.put("/:id", authMiddleware, expenseController.updateExpense);
router.delete("/:id", authMiddleware, expenseController.deleteExpense);

module.exports = router;
