import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  selectedVariant: {
    size: String,
    color: String,
    weight: String
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: "India" }
  },
  billingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: "India" }
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["Stripe", "Razorpay", "UPI", "COD"]
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ["Pending", "Success", "Failed", "Refunded"],
    default: "Pending"
  },
  orderStatus: {
    type: String,
    required: true,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"],
    default: "Pending"
  },
  itemsPrice: { type: Number, required: true, default: 0.0 },
  taxPrice: { type: Number, required: true, default: 0.0 }, // GST
  shippingPrice: { type: Number, required: true, default: 0.0 },
  discountPrice: { type: Number, required: true, default: 0.0 },
  totalPrice: { type: Number, required: true, default: 0.0 },
  couponCode: { type: String },
  trackingNumber: { type: String },
  deliveredAt: { type: Date },
  returnedAt: { type: Date },
  refundedAt: { type: Date },
  returnRequestReason: { type: String },
  returnRequestStatus: {
    type: String,
    enum: ["None", "Requested", "Approved", "Rejected"],
    default: "None"
  }
}, {
  timestamps: true
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
