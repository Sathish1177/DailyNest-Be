import mongoose from "mongoose";

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  tagline: {
    type: String,
    trim: true,
    default: "Your trusted local store on DailyNest"
  },
  description: {
    type: String,
    trim: true,
    default: "We provide high-quality daily essentials and fresh products directly to your doorstep."
  },
  logo: {
    type: String,
    default: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=80"
  },
  banner: {
    type: String,
    default: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80"
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  category: {
    type: String,
    default: "Grocery & Essentials"
  },
  address: {
    addressLine1: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    postalCode: { type: String, default: "" }
  },
  socialLinks: {
    whatsapp: { type: String, default: "" },
    instagram: { type: String, default: "" },
    facebook: { type: String, default: "" },
    website: { type: String, default: "" }
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "suspended"],
    default: "approved"
  },
  rating: {
    type: Number,
    default: 4.8
  },
  numReviews: {
    type: Number,
    default: 12
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Store = mongoose.model("Store", storeSchema);
export default Store;

