const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post("/", authMiddleware, upload.single("image"), categoryController.createCategory);
router.get("/", authMiddleware, categoryController.getCategories);
router.get("/:id", authMiddleware, categoryController.getCategory);
router.put("/:id", authMiddleware, upload.single("image"), categoryController.updateCategory);
router.delete("/:id", authMiddleware, categoryController.deleteCategory);

module.exports = router;
