const express = require("express");
const router = express.Router();
const businessController = require("../controllers/businessController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.get("/", authMiddleware, businessController.getBusinessProfile);
router.put("/", authMiddleware, upload.single("logo"), businessController.updateBusinessProfile);

module.exports = router;
