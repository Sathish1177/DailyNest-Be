import Category from "../models/Category.js";
import Subcategory from "../models/Subcategory.js";

// Helper to make slug
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
};

// CATEGORIES CRUD

// Create Category
export const createCategory = async (req, res) => {
  const { name, description } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Category image is required" });
    }

    const slug = slugify(name);
    const categoryExists = await Category.findOne({ slug });
    if (categoryExists) {
      return res.status(400).json({ message: "Category with this name already exists" });
    }

    // Save local upload path, e.g. /uploads/image-xxx.png
    const imagePath = `/uploads/${req.file.filename}`;

    const category = await Category.create({
      name,
      slug,
      description,
      image: imagePath
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Error creating category", error: error.message });
  }
};

// Get All Categories (Public)
export const getCategories = async (req, res) => {
  const { activeOnly } = req.query;
  try {
    const filter = {};
    if (activeOnly === "true") {
      filter.isActive = true;
    }
    const categories = await Category.find(filter).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error loading categories", error: error.message });
  }
};

// Get Single Category
export const getCategoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Error loading category", error: error.message });
  }
};

// Update Category
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;
  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (name) {
      category.name = name;
      category.slug = slugify(name);
    }
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;
    if (req.file) {
      category.image = `/uploads/${req.file.filename}`;
    }

    await category.save();
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Error updating category", error: error.message });
  }
};

// Delete Category
export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Delete cascading subcategories
    await Subcategory.deleteMany({ mainCategory: id });

    res.json({ message: "Category and its subcategories deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting category", error: error.message });
  }
};


// SUBCATEGORIES CRUD

// Create Subcategory
export const createSubcategory = async (req, res) => {
  const { name, description, mainCategory } = req.body;
  try {
    if (!name || !mainCategory) {
      return res.status(400).json({ message: "Subcategory name and parent Category are required" });
    }

    const slug = slugify(name);
    const subcatExists = await Subcategory.findOne({ slug });
    if (subcatExists) {
      return res.status(400).json({ message: "Subcategory name already exists" });
    }

    let imagePath = "";
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    const subcategory = await Subcategory.create({
      name,
      slug,
      description,
      mainCategory,
      image: imagePath
    });

    res.status(201).json(subcategory);
  } catch (error) {
    res.status(500).json({ message: "Error creating subcategory", error: error.message });
  }
};

// Get All Subcategories
export const getSubcategories = async (req, res) => {
  const { mainCategory, activeOnly } = req.query;
  try {
    const filter = {};
    if (mainCategory) {
      filter.mainCategory = mainCategory;
    }
    if (activeOnly === "true") {
      filter.isActive = true;
    }

    const subcategories = await Subcategory.find(filter).populate("mainCategory", "name").sort({ name: 1 });
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ message: "Error loading subcategories", error: error.message });
  }
};

// Update Subcategory
export const updateSubcategory = async (req, res) => {
  const { id } = req.params;
  const { name, description, mainCategory, isActive } = req.body;
  try {
    const subcat = await Subcategory.findById(id);
    if (!subcat) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    if (name) {
      subcat.name = name;
      subcat.slug = slugify(name);
    }
    if (description !== undefined) subcat.description = description;
    if (mainCategory) subcat.mainCategory = mainCategory;
    if (isActive !== undefined) subcat.isActive = isActive;
    if (req.file) {
      subcat.image = `/uploads/${req.file.filename}`;
    }

    await subcat.save();
    res.json(subcat);
  } catch (error) {
    res.status(500).json({ message: "Error updating subcategory", error: error.message });
  }
};

// Delete Subcategory
export const deleteSubcategory = async (req, res) => {
  const { id } = req.params;
  try {
    const subcat = await Subcategory.findByIdAndDelete(id);
    if (!subcat) {
      return res.status(404).json({ message: "Subcategory not found" });
    }
    res.json({ message: "Subcategory deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting subcategory", error: error.message });
  }
};
