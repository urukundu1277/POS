const express = require("express");
const router = express.Router();
const superAdminController = require("../controllers/superAdminController");
const superAdminMiddleware = require("../middleware/superAdminMiddleware");

// Super Admin Auth
router.post("/register", superAdminController.registerSuperAdmin);
router.post("/login", superAdminController.loginSuperAdmin);
router.get("/me", superAdminMiddleware, superAdminController.getSuperAdminProfile);

// Business Management (Super Admin only)
router.get("/businesses", superAdminMiddleware, superAdminController.getAllBusinesses);
router.get("/businesses/:id", superAdminMiddleware, superAdminController.getBusinessById);
router.post("/businesses", superAdminMiddleware, superAdminController.createBusiness);
router.put("/businesses/:id", superAdminMiddleware, superAdminController.updateBusiness);
router.patch("/businesses/:id/toggle-status", superAdminMiddleware, superAdminController.toggleBusinessStatus);
router.delete("/businesses/:id", superAdminMiddleware, superAdminController.deleteBusiness);
router.put("/users/:id/reset-password", superAdminMiddleware, superAdminController.resetUserPassword);
router.get("/stats", superAdminMiddleware, superAdminController.getSuperAdminStats);

module.exports = router;
