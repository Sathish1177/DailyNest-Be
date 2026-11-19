import jwt from "jsonwebtoken";
import Store from "../models/Store.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "dailynest_jwt_secret_key_12345", {
    expiresIn: "30d"
  });
};

// Helper for slug generation
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
};

// 1. REGISTER / ONBOARD A NEW STORE
export const registerStore = async (req, res) => {
  try {
    const {
      storeName,
      tagline,
      description,
      category,
      city,
      addressLine1,
      state,
      postalCode,
      phone,
      whatsapp,
      ownerName,
      mobileNumber,
      email,
      password,
      logo,
      banner
    } = req.body;

    if (!storeName || !ownerName || !mobileNumber || !password) {
      return res.status(400).json({
        message: "Store Name, Owner Name, Mobile Number and Password are required"
      });
    }

    // Check if user already exists
    let user = await User.findOne({ mobileNumber });
    if (user) {
      return res.status(400).json({
        message: "This mobile number is already registered. Please login or use a different number."
      });
    }

    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "This email is already in use." });
      }
    }

    // Generate unique slug
    let baseSlug = slugify(storeName);
    if (!baseSlug) baseSlug = "store-" + Math.floor(1000 + Math.random() * 9000);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await Store.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create User with role: store-admin
    user = new User({
      name: ownerName,
      mobileNumber,
      email: email || undefined,
      password,
      role: "store-admin",
      isActive: true
    });
    await user.save();

    // Create Store
    const store = new Store({
      name: storeName,
      slug: uniqueSlug,
      owner: user._id,
      tagline: tagline || "Your trusted store on DailyNest",
      description: description || "Fresh products & daily essentials directly from our store.",
      category: category || "Grocery & Essentials",
      phone: phone || mobileNumber,
      email: email || "",
      logo: logo || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=80",
      banner: banner || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80",
      address: {
        addressLine1: addressLine1 || "",
        city: city || "",
        state: state || "Tamil Nadu",
        postalCode: postalCode || ""
      },
      socialLinks: {
        whatsapp: whatsapp || mobileNumber
      },
      status: "approved"
    });
    await store.save();

    // Link store back to user
    user.store = store._id;
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Store registered successfully!",
      token,
      user: {
        _id: user._id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        email: user.email,
        role: user.role,
        store: store._id
      },
      store
    });
  } catch (error) {
    console.error("Store registration error:", error);
    res.status(500).json({ message: "Error registering store", error: error.message });
  }
};

// 2. GET MY STORE (Store Admin)
export const getMyStore = async (req, res) => {
  try {
    let store = await Store.findOne({ owner: req.user._id });
    if (!store && req.user.store) {
      store = await Store.findById(req.user.store);
    }

    if (!store) {
      return res.status(404).json({ message: "Store profile not found for this account" });
    }

    res.json(store);
  } catch (error) {
    res.status(500).json({ message: "Error fetching store profile", error: error.message });
  }
};

// 3. UPDATE MY STORE (Store Admin)
export const updateMyStore = async (req, res) => {
  try {
    let store = await Store.findOne({ owner: req.user._id });
    if (!store && req.user.store) {
      store = await Store.findById(req.user.store);
    }

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    const {
      name,
      tagline,
      description,
      category,
      logo,
      banner,
      phone,
      email,
      address,
      socialLinks
    } = req.body;

    if (name) store.name = name;
    if (tagline !== undefined) store.tagline = tagline;
    if (description !== undefined) store.description = description;
    if (category !== undefined) store.category = category;
    if (logo) store.logo = logo;
    if (banner) store.banner = banner;
    if (phone) store.phone = phone;
    if (email) store.email = email;
    if (address) store.address = { ...store.address, ...address };
    if (socialLinks) store.socialLinks = { ...store.socialLinks, ...socialLinks };

    await store.save();
    res.json({ success: true, message: "Store profile updated successfully", store });
  } catch (error) {
    res.status(500).json({ message: "Error updating store", error: error.message });
  }
};

// 4. GET MY STORE'S PRODUCTS
export const getMyStoreProducts = async (req, res) => {
  try {
    let store = await Store.findOne({ owner: req.user._id });
    if (!store && req.user.store) {
      store = await Store.findById(req.user.store);
    }

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    const products = await Product.find({ store: store._id })
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching store products", error: error.message });
  }
};

// 5. CREATE A PRODUCT FOR MY STORE
export const createStoreProduct = async (req, res) => {
  try {
    let store = await Store.findOne({ owner: req.user._id });
    if (!store && req.user.store) {
      store = await Store.findById(req.user.store);
    }

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    const {
      name,
      shortDescription,
      description,
      price,
      discountPrice,
      stock,
      category,
      subcategory,
      images,
      brand,
      variants,
      tags
    } = req.body;

    if (!name || !price || !stock || !category) {
      return res.status(400).json({ message: "Name, price, stock, and category are required" });
    }

    // Generate unique slug
    let baseSlug = slugify(name);
    let uniqueSlug = baseSlug;
    let count = 1;
    while (await Product.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${count}`;
      count++;
    }

    // Generate SKU
    const SKU = `DN-${store.slug.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;

    // Process images (either array of strings or file uploads)
    let productImages = [];
    if (req.files && req.files.length > 0) {
      productImages = req.files.map((file) => `/uploads/${file.filename}`);
    } else if (images && Array.isArray(images) && images.length > 0) {
      productImages = images;
    } else if (typeof images === "string" && images.trim().length > 0) {
      productImages = [images.trim()];
    } else {
      productImages = ["https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80"];
    }

    const product = new Product({
      name,
      slug: uniqueSlug,
      shortDescription: shortDescription || name,
      description: description || name,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      stock: Number(stock),
      SKU,
      brand: brand || store.name,
      category,
      subcategory: subcategory || category, // fallback to category if subcategory not selected
      images: productImages,
      store: store._id,
      variants: variants || [],
      tags: tags || [],
      isActive: true
    });

    await product.save();
    res.status(201).json({ success: true, message: "Product created successfully", product });
  } catch (error) {
    console.error("Create store product error:", error);
    res.status(500).json({ message: "Error creating product", error: error.message });
  }
};

// 6. UPDATE STORE PRODUCT
export const updateStoreProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let store = await Store.findOne({ owner: req.user._id });
    if (!store && req.user.store) {
      store = await Store.findById(req.user.store);
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Verify ownership (unless super-admin)
    if (req.user.role !== "super-admin" && (!product.store || product.store.toString() !== store._id.toString())) {
      return res.status(403).json({ message: "Not authorized to update this product" });
    }

    const updatableFields = [
      "name", "shortDescription", "description", "price", "discountPrice",
      "stock", "category", "subcategory", "brand", "isActive", "images"
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();
    res.json({ success: true, message: "Product updated successfully", product });
  } catch (error) {
    res.status(500).json({ message: "Error updating product", error: error.message });
  }
};

// 7. DELETE STORE PRODUCT
export const deleteStoreProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let store = await Store.findOne({ owner: req.user._id });
    if (!store && req.user.store) {
      store = await Store.findById(req.user.store);
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (req.user.role !== "super-admin" && (!product.store || product.store.toString() !== store._id.toString())) {
      return res.status(403).json({ message: "Not authorized to delete this product" });
    }

    await Product.findByIdAndDelete(id);
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error: error.message });
  }
};

// 8. PUBLIC: GET DEDICATED STOREFRONT BY SLUG (Includes store info & its products)
export const getPublicStoreBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const store = await Store.findOne({ slug, status: "approved" }).populate("owner", "name email");

    if (!store) {
      return res.status(404).json({ message: "Store not found or currently inactive" });
    }

    // Fetch this store's active products
    const products = await Product.find({ store: store._id, isActive: true })
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .sort({ createdAt: -1 });

    // Distinct categories for filter
    const categoryIds = [...new Set(products.map((p) => p.category?._id?.toString()).filter(Boolean))];
    const categories = await Category.find({ _id: { $in: categoryIds } }).select("name slug");

    res.json({
      store,
      products,
      categories,
      totalProducts: products.length
    });
  } catch (error) {
    res.status(500).json({ message: "Error loading store page", error: error.message });
  }
};

// 9. PUBLIC: GET ALL APPROVED STORES (For marketplace partner listing)
export const getAllStores = async (req, res) => {
  try {
    const stores = await Store.find({ status: "approved" }).sort({ rating: -1, createdAt: -1 });
    
    // Fetch product counts for each store
    const storesWithCounts = await Promise.all(
      stores.map(async (st) => {
        const productCount = await Product.countDocuments({ store: st._id, isActive: true });
        return {
          ...st.toObject(),
          productCount
        };
      })
    );

    res.json(storesWithCounts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching stores", error: error.message });
  }
};

// 10. SUPER ADMIN: GET ALL STORES WITH MANAGEMENT STATS
export const getStoresForAdmin = async (req, res) => {
  try {
    const stores = await Store.find({})
      .populate("owner", "name mobileNumber email")
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(
      stores.map(async (st) => {
        const productCount = await Product.countDocuments({ store: st._id });
        return {
          ...st.toObject(),
          productCount
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: "Error loading admin stores list", error: error.message });
  }
};

// 11. SUPER ADMIN: TOGGLE STORE STATUS (Approve / Suspend)
export const toggleStoreStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "approved", "suspended", "rejected"

    const store = await Store.findById(id);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    store.status = status;
    await store.save();

    res.json({ success: true, message: `Store status updated to ${status}`, store });
  } catch (error) {
    res.status(500).json({ message: "Error updating store status", error: error.message });
  }
};

