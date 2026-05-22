import Coupon from "../models/Coupon.js";

// CREATE COUPON
export const createCoupon = async (req, res) => {
  const { code, discountType, discountValue, minPurchase, maxDiscount, expiryDate, usageLimit } = req.body;
  try {
    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
    if (couponExists) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      expiryDate,
      usageLimit
    });

    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: "Error creating coupon", error: error.message });
  }
};

// GET ALL COUPONS (Admin)
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ expiryDate: 1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: "Error loading coupons", error: error.message });
  }
};

// UPDATE COUPON (Admin)
export const updateCoupon = async (req, res) => {
  const { id } = req.params;
  const { code, discountType, discountValue, minPurchase, maxDiscount, expiryDate, isActive, usageLimit } = req.body;
  try {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (code) coupon.code = code.toUpperCase();
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = Number(discountValue);
    if (minPurchase !== undefined) coupon.minPurchase = Number(minPurchase);
    if (maxDiscount !== undefined) coupon.maxDiscount = Number(maxDiscount);
    if (expiryDate) coupon.expiryDate = expiryDate;
    if (isActive !== undefined) coupon.isActive = isActive;
    if (usageLimit !== undefined) coupon.usageLimit = Number(usageLimit);

    await coupon.save();
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: "Error updating coupon", error: error.message });
  }
};

// DELETE COUPON
export const deleteCoupon = async (req, res) => {
  const { id } = req.params;
  try {
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting coupon", error: error.message });
  }
};

// VALIDATE COUPON (Checkout verification)
export const validateCoupon = async (req, res) => {
  const { code, purchaseAmount } = req.body;
  try {
    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code" });
    }

    const valid = coupon.isValid(Number(purchaseAmount));
    if (!valid) {
      return res.status(400).json({
        message: "Coupon is either expired, inactive, usage-limited, or purchase amount is insufficient"
      });
    }

    res.json({
      message: "Coupon is valid",
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount,
      minPurchase: coupon.minPurchase
    });
  } catch (error) {
    res.status(500).json({ message: "Error validating coupon", error: error.message });
  }
};
