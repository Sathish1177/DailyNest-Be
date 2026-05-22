import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    required: true,
    enum: ["Percentage", "Fixed"],
    default: "Percentage"
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minPurchase: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  maxDiscount: {
    type: Number, // Cap discount for percentage coupons
    min: 0
  },
  expiryDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageLimit: {
    type: Number,
    default: 100 // Total times this coupon can be used
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Helper check to see if coupon is valid
couponSchema.methods.isValid = function(purchaseAmount) {
  const now = new Date();
  if (!this.isActive) return false;
  if (now > this.expiryDate) return false;
  if (this.usageCount >= this.usageLimit) return false;
  if (purchaseAmount < this.minPurchase) return false;
  return true;
};

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
