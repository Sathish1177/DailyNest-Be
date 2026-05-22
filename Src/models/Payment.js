import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  transactionId: {
    type: String,
    required: function() { return this.gateway !== "COD"; }
  },
  amount: {
    type: Number,
    required: true
  },
  gateway: {
    type: String,
    required: true,
    enum: ["Stripe", "Razorpay", "UPI", "COD"]
  },
  status: {
    type: String,
    required: true,
    enum: ["Pending", "Success", "Failed", "Refunded"],
    default: "Pending"
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed // Store the raw gateway response log
  }
}, {
  timestamps: true
});

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
