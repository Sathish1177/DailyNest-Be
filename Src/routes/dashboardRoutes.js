import express from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

// Stats access (Admin & Super Admin)
router.get("/stats", protect, restrictTo("admin", "super-admin"), getDashboardStats);

export default router;
