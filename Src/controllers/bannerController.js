import Banner from "../models/Banner.js";

// CREATE BANNER (Admin)
export const createBanner = async (req, res) => {
  const { title, description, link, type, order } = req.body;
  try {
    if (!title) {
      return res.status(400).json({ message: "Banner title is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Banner image file is required" });
    }

    const banner = await Banner.create({
      title,
      description,
      image: `/uploads/${req.file.filename}`,
      link,
      type,
      order: order ? Number(order) : 0
    });

    res.status(201).json(banner);
  } catch (error) {
    res.status(500).json({ message: "Error creating banner", error: error.message });
  }
};

// GET ACTIVE BANNERS (Public)
export const getActiveBanners = async (req, res) => {
  const { type } = req.query;
  try {
    const filter = { isActive: true };
    if (type) filter.type = type;

    const banners = await Banner.find(filter).sort({ order: 1, createdAt: -1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: "Error loading banners", error: error.message });
  }
};

// GET ALL BANNERS (Admin)
export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find({}).sort({ order: 1, createdAt: -1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: "Error loading all banners", error: error.message });
  }
};

// UPDATE BANNER
export const updateBanner = async (req, res) => {
  const { id } = req.params;
  const { title, description, link, type, order, isActive } = req.body;
  try {
    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    if (title) banner.title = title;
    if (description !== undefined) banner.description = description;
    if (link !== undefined) banner.link = link;
    if (type) banner.type = type;
    if (order !== undefined) banner.order = Number(order);
    if (isActive !== undefined) banner.isActive = isActive === "true" || isActive === true;

    if (req.file) {
      banner.image = `/uploads/${req.file.filename}`;
    }

    await banner.save();
    res.json(banner);
  } catch (error) {
    res.status(500).json({ message: "Error updating banner", error: error.message });
  }
};

// DELETE BANNER
export const deleteBanner = async (req, res) => {
  const { id } = req.params;
  try {
    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    res.json({ message: "Banner deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting banner", error: error.message });
  }
};
