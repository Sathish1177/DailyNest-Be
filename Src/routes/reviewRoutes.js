import express from "express";
import {
  createReview,
  getProductReviews,
  getAllReviews,
  approveReview,
  deleteReview
} from "../controllers/reviewController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

// Public
router.get("/product/:productId", getProductReviews);

// Customer
router.post("/", protect, createReview);
router.delete("/:id", protect, deleteReview);

// Admin / Super Admin
router.get("/", protect, restrictTo("admin", "super-admin"), getAllReviews);
router.get("/all", protect, restrictTo("admin", "super-admin"), getAllReviews);
router.put("/:id/approve", protect, restrictTo("admin", "super-admin"), approveReview);

export default router;
