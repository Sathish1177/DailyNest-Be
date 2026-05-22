import express from "express";
import {
  createBanner,
  getActiveBanners,
  getAllBanners,
  updateBanner,
  deleteBanner
} from "../controllers/bannerController.js";
import { protect, restrictTo } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// Public
router.get("/", getActiveBanners);

// Admin
router.get("/all", protect, restrictTo("admin", "super-admin"), getAllBanners);
router.post("/", protect, restrictTo("admin", "super-admin"), upload.single("image"), createBanner);
router.put("/:id", protect, restrictTo("admin", "super-admin"), upload.single("image"), updateBanner);
router.delete("/:id", protect, restrictTo("admin", "super-admin"), deleteBanner);

export default router;
