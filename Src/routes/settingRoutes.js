import express from "express";
import {
  getSettings,
  getSettingByKey,
  updateSetting,
  getAdminsList,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getActivityLogs
} from "../controllers/settingController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

// Public
router.get("/key/:key", getSettingByKey);

// Admin/Super Admin general
router.get("/", protect, restrictTo("admin", "super-admin"), getSettings);

// Super Admin Only
router.post("/", protect, restrictTo("super-admin"), updateSetting);

// Admin Account CRUD (Super Admin Dashboard)
router.get("/admins", protect, restrictTo("super-admin"), getAdminsList);
router.post("/admins", protect, restrictTo("super-admin"), createAdmin);
router.put("/admins/:id", protect, restrictTo("super-admin"), updateAdmin);
router.delete("/admins/:id", protect, restrictTo("super-admin"), deleteAdmin);

// Logs
router.get("/logs", protect, restrictTo("super-admin"), getActivityLogs);

export default router;
