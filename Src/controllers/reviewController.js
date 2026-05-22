import Review from "../models/Review.js";
import Product from "../models/Product.js";

// CREATE REVIEW (Customer)
export const createReview = async (req, res) => {
  const { productId, rating, comment } = req.body;
  try {
    if (!productId || !rating || !comment) {
      return res.status(400).json({ message: "Product, rating, and comment are required" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already reviewed
    const reviewExists = await Review.findOne({ product: productId, user: req.user.id });
    if (reviewExists) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    const review = await Review.create({
      product: productId,
      user: req.user.id,
      userName: req.user.name,
      rating: Number(rating),
      comment
    });

    res.status(201).json({
      message: "Review submitted successfully! It is pending administrator approval.",
      review
    });
  } catch (error) {
    res.status(500).json({ message: "Error submitting review", error: error.message });
  }
};

// GET PRODUCT REVIEWS (Public - Only Approved)
export const getProductReviews = async (req, res) => {
  const { productId } = req.params;
  try {
    const reviews = await Review.find({ product: productId, isApproved: true })
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Error loading reviews", error: error.message });
  }
};

// GET ALL REVIEWS (Admin - For Approval)
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate("product", "name SKU")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Error loading reviews", error: error.message });
  }
};

// APPROVE REVIEW (Admin)
export const approveReview = async (req, res) => {
  const { id } = req.params;
  const isApproved = req.body && req.body.isApproved !== undefined ? req.body.isApproved : true;
  try {
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.isApproved = isApproved;
    await review.save(); // Triggers calculateAverageRating post-save hook

    res.json({ message: `Review status updated to: ${isApproved ? "Approved" : "Rejected"}`, review });
  } catch (error) {
    res.status(500).json({ message: "Error updating review status", error: error.message });
  }
};

// DELETE REVIEW (Admin/Owner)
export const deleteReview = async (req, res) => {
  const { id } = req.params;
  try {
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Allow deleting only if user is admin or the review creator
    if (review.user.toString() !== req.user.id && req.user.role === "customer") {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(id); // Triggers post findOneAndDelete rating update

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting review", error: error.message });
  }
};
