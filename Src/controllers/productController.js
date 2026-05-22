import Product from "../models/Product.js";

// Helper to make slug
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
};

// CREATE PRODUCT
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      shortDescription,
      description,
      price,
      discountPrice,
      stock,
      SKU,
      brand,
      category,
      subcategory,
      variants,
      tags,
      isFeatured,
      isTrending,
      isBestSeller,
      isComingSoon,
      isActive
    } = req.body;

    // Check files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one product image is required" });
    }

    const slug = slugify(name);
    const productExists = await Product.findOne({ slug });
    if (productExists) {
      return res.status(400).json({ message: "Product with this name already exists" });
    }

    // Process uploaded files
    const images = req.files.map((file) => `/uploads/${file.filename}`);

    // Parse stringified JSON fields (since multer sends form-data)
    let parsedVariants = [];
    if (variants) {
      parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants;
    }

    let parsedTags = [];
    if (tags) {
      if (typeof tags === "string") {
        const trimmed = tags.trim();
        if (trimmed.startsWith("[")) {
          try {
            parsedTags = JSON.parse(trimmed);
          } catch (e) {
            parsedTags = trimmed.split(",").map((t) => t.trim()).filter(Boolean);
          }
        } else {
          parsedTags = trimmed.split(",").map((t) => t.trim()).filter(Boolean);
        }
      } else {
        parsedTags = tags;
      }
    }

    const product = await Product.create({
      name,
      slug,
      shortDescription,
      description,
      price,
      discountPrice: discountPrice || undefined,
      stock: stock || 0,
      SKU,
      brand,
      images,
      category,
      subcategory,
      variants: parsedVariants,
      tags: parsedTags,
      isFeatured: isFeatured === "true" || isFeatured === true,
      isTrending: isTrending === "true" || isTrending === true,
      isBestSeller: isBestSeller === "true" || isBestSeller === true,
      isComingSoon: isComingSoon === "true" || isComingSoon === true,
      isActive: isActive !== "false" && isActive !== false
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Error creating product", error: error.message });
  }
};

// GET ALL PRODUCTS (With filters, search, sort, pagination)
export const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      subcategory,
      minPrice,
      maxPrice,
      sort,
      isFeatured,
      isTrending,
      isBestSeller,
      isComingSoon,
      isActive,
      page = 1,
      limit = 12
    } = req.query;

    const query = {};

    // Filters
    if (isActive !== undefined) {
      query.isActive = isActive === "true" || isActive === true;
    } else {
      // By default, only return active products for customers (unless specified, or admin fetches)
      query.isActive = true;
    }

    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;

    if (isFeatured !== undefined) query.isFeatured = isFeatured === "true";
    if (isTrending !== undefined) query.isTrending = isTrending === "true";
    if (isBestSeller !== undefined) query.isBestSeller = isBestSeller === "true";
    if (isComingSoon !== undefined) query.isComingSoon = isComingSoon === "true";

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Search query (text search)
    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Sorting
    let sortOptions = { createdAt: -1 }; // Default: Newest first
    if (sort) {
      if (sort === "price-low-high") sortOptions = { price: 1 };
      else if (sort === "price-high-low") sortOptions = { price: -1 };
      else if (sort === "popularity") sortOptions = { ratingsAverage: -1 };
      else if (sort === "newest") sortOptions = { createdAt: -1 };
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      products,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    });
  } catch (error) {
    res.status(500).json({ message: "Error loading products", error: error.message });
  }
};

// GET SINGLE PRODUCT BY SLUG OR ID
export const getProductBySlugOrId = async (req, res) => {
  const { param } = req.params;
  try {
    let query = { slug: param };
    // Check if it's a valid MongoDB ObjectId
    if (param.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: param };
    }

    const product = await Product.findOne(query)
      .populate("category", "name slug")
      .populate("subcategory", "name slug");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error loading product", error: error.message });
  }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const {
      name,
      shortDescription,
      description,
      price,
      discountPrice,
      stock,
      SKU,
      brand,
      category,
      subcategory,
      variants,
      tags,
      isFeatured,
      isTrending,
      isBestSeller,
      isComingSoon,
      isActive
    } = req.body;

    if (name) {
      product.name = name;
      product.slug = slugify(name);
    }
    if (shortDescription !== undefined) product.shortDescription = shortDescription;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (discountPrice !== undefined) product.discountPrice = discountPrice ? Number(discountPrice) : undefined;
    if (stock !== undefined) product.stock = Number(stock);
    if (SKU !== undefined) product.SKU = SKU;
    if (brand !== undefined) product.brand = brand;
    if (category !== undefined) product.category = category;
    if (subcategory !== undefined) product.subcategory = subcategory;

    if (isFeatured !== undefined) product.isFeatured = isFeatured === "true" || isFeatured === true;
    if (isTrending !== undefined) product.isTrending = isTrending === "true" || isTrending === true;
    if (isBestSeller !== undefined) product.isBestSeller = isBestSeller === "true" || isBestSeller === true;
    if (isComingSoon !== undefined) product.isComingSoon = isComingSoon === "true" || isComingSoon === true;
    if (isActive !== undefined) product.isActive = isActive === "true" || isActive === true;

    // Parse arrays
    if (variants) {
      product.variants = typeof variants === "string" ? JSON.parse(variants) : variants;
    }
    if (tags) {
      if (typeof tags === "string") {
        const trimmed = tags.trim();
        if (trimmed.startsWith("[")) {
          try {
            product.tags = JSON.parse(trimmed);
          } catch (e) {
            product.tags = trimmed.split(",").map((t) => t.trim()).filter(Boolean);
          }
        } else {
          product.tags = trimmed.split(",").map((t) => t.trim()).filter(Boolean);
        }
      } else {
        product.tags = tags;
      }
    }

    // Append/Replace images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => `/uploads/${file.filename}`);
      // Replace existing images, or merge them. Here we replace for ease of use, or let's replace if specified
      product.images = newImages;
    }

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error updating product", error: error.message });
  }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error: error.message });
  }
};
