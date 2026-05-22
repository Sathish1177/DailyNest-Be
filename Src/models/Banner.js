import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String, // Banner file path
    required: true
  },
  link: {
    type: String, // Where the banner routes to, e.g. /shop?category=electronics
    default: "/"
  },
  type: {
    type: String,
    enum: ["Hero", "Offer"],
    default: "Hero"
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Banner = mongoose.model("Banner", bannerSchema);
export default Banner;
