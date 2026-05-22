import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  createSubcategory,
  getSubcategories,
  updateSubcategory,
  deleteSubcategory
} from "../controllers/categoryController.js";
import { protect, restrictTo } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// SUBCATEGORIES (Defined first to prevent wildcard parameter matching conflicts)
router.get("/sub/all", getSubcategories);
router.get("/subcategories", getSubcategories);

router.post("/sub", protect, restrictTo("admin", "super-admin"), upload.single("image"), createSubcategory);
router.post("/subcategory", protect, restrictTo("admin", "super-admin"), upload.single("image"), createSubcategory);

router.put("/sub/:id", protect, restrictTo("admin", "super-admin"), upload.single("image"), updateSubcategory);
router.put("/subcategory/:id", protect, restrictTo("admin", "super-admin"), upload.single("image"), updateSubcategory);

router.delete("/sub/:id", protect, restrictTo("admin", "super-admin"), deleteSubcategory);
router.delete("/subcategory/:id", protect, restrictTo("admin", "super-admin"), deleteSubcategory);

// CATEGORIES
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.post("/", protect, restrictTo("admin", "super-admin"), upload.single("image"), createCategory);
router.put("/:id", protect, restrictTo("admin", "super-admin"), upload.single("image"), updateCategory);
router.delete("/:id", protect, restrictTo("admin", "super-admin"), deleteCategory);

export default router;
