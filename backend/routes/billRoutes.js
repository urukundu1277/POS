const express = require("express");
const router = express.Router();
const billController = require("../controllers/billController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, billController.createBill);
router.get("/", authMiddleware, billController.getBills);
router.get("/:id", authMiddleware, billController.getBill);

module.exports = router;
