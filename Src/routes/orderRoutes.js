import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  requestOrderReturn,
  manageOrderReturn
} from "../controllers/orderController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

// Customer
router.post("/", protect, createOrder);
router.get("/myorders", protect, getMyOrders);
router.get("/:id", protect, getOrderById);
router.put("/:id/return", protect, requestOrderReturn);

// Admin / Super Admin
router.get("/", protect, restrictTo("admin", "super-admin"), getAllOrders);
router.put("/:id/status", protect, restrictTo("admin", "super-admin"), updateOrderStatus);
router.put("/:id/return-manage", protect, restrictTo("admin", "super-admin"), manageOrderReturn);

export default router;
