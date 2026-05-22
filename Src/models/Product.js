import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema({
  size: { type: String }, // e.g. S, M, L, 500g, 1kg
  color: { type: String }, // e.g. Red, Green, Blue
  weight: { type: String }, // e.g. 100g, 1kg
  price: { type: Number }, // Specific variant price if different
  stock: { type: Number, default: 0 } // Specific variant stock
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  shortDescription: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String, // Local upload file paths
    required: true
  }],
  video: {
    type: String // Optional path/URL to a product video
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountPrice: {
    type: Number,
    min: 0,
    validate: {
      validator: function(val) {
        return val === undefined || val === null || val <= this.price;
      },
      message: "Discount price ({VALUE}) must be less than or equal to the original price."
    }
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  SKU: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  variants: [productVariantSchema],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subcategory",
    required: true
  },
  tags: [{
    type: String
  }],
  isFeatured: {
    type: Boolean,
    default: false
  },
  isTrending: {
    type: Boolean,
    default: false
  },
  isBestSeller: {
    type: Boolean,
    default: false
  },
  isComingSoon: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  ratingsAverage: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Helper index for search queries
productSchema.index({ name: "text", description: "text", brand: "text", tags: "text" });

const Product = mongoose.model("Product", productSchema);
export default Product;
