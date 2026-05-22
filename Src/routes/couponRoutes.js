import express from "express";
import {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  validateCoupon
} from "../controllers/couponController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

// Public/Customer (validate coupon for checkout)
router.post("/validate", protect, validateCoupon);

// Admin
router.post("/", protect, restrictTo("admin", "super-admin"), createCoupon);
router.get("/", protect, restrictTo("admin", "super-admin"), getCoupons);
router.put("/:id", protect, restrictTo("admin", "super-admin"), updateCoupon);
router.delete("/:id", protect, restrictTo("admin", "super-admin"), deleteCoupon);

export default router;
