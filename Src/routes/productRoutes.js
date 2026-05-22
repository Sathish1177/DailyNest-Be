import express from "express";
import {
  createProduct,
  getProducts,
  getProductBySlugOrId,
  updateProduct,
  deleteProduct
} from "../controllers/productController.js";
import { protect, restrictTo } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// Public
router.get("/", getProducts);
router.get("/:param", getProductBySlugOrId);

// Admin / Super Admin write operations
router.post("/", protect, restrictTo("admin", "super-admin"), upload.array("images", 10), createProduct);
router.put("/:id", protect, restrictTo("admin", "super-admin"), upload.array("images", 10), updateProduct);
router.delete("/:id", protect, restrictTo("admin", "super-admin"), deleteProduct);

export default router;
