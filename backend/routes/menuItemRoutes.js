const express = require("express");
const router = express.Router();
const menuItemController = require("../controllers/menuItemController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post("/", authMiddleware, upload.single("image"), menuItemController.createMenuItem);
router.get("/", authMiddleware, menuItemController.getMenuItems);
router.get("/:id", authMiddleware, menuItemController.getMenuItem);
router.put("/:id", authMiddleware, upload.single("image"), menuItemController.updateMenuItem);
router.delete("/:id", authMiddleware, menuItemController.deleteMenuItem);

module.exports = router;
