import express from "express";
import {
  registerStore,
  getMyStore,
  updateMyStore,
  getMyStoreProducts,
  createStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
  getPublicStoreBySlug,
  getAllStores,
  getStoresForAdmin,
  toggleStoreStatus
} from "../controllers/storeController.js";
import { protect, restrictTo } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// Public routes
router.post("/register", registerStore);
router.get("/public/all", getAllStores);
router.get("/public/:slug", getPublicStoreBySlug);

// Store Admin routes
router.get("/my-store", protect, restrictTo("store-admin", "admin", "super-admin"), getMyStore);
router.put("/my-store", protect, restrictTo("store-admin", "admin", "super-admin"), updateMyStore);
router.get("/my-store/products", protect, restrictTo("store-admin", "admin", "super-admin"), getMyStoreProducts);
router.post(
  "/my-store/products",
  protect,
  restrictTo("store-admin", "admin", "super-admin"),
  upload.array("images", 5),
  createStoreProduct
);
router.put("/my-store/products/:id", protect, restrictTo("store-admin", "admin", "super-admin"), updateStoreProduct);
router.delete("/my-store/products/:id", protect, restrictTo("store-admin", "admin", "super-admin"), deleteStoreProduct);

// Super Admin oversight routes
router.get("/admin/all", protect, restrictTo("super-admin"), getStoresForAdmin);
router.put("/admin/:id/status", protect, restrictTo("super-admin"), toggleStoreStatus);

export default router;

