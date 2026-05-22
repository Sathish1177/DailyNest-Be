import Setting from "../models/Setting.js";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";

// GET SITE SETTINGS
export const getSettings = async (req, res) => {
  try {
    const settings = await Setting.find({});
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Error loading website settings", error: error.message });
  }
};

// GET SETTING BY KEY
export const getSettingByKey = async (req, res) => {
  const { key } = req.params;
  try {
    const setting = await Setting.findOne({ key });
    if (!setting) {
      return res.status(404).json({ message: `Setting not found for key: ${key}` });
    }
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: "Error loading setting key", error: error.message });
  }
};

// UPDATE/CREATE SETTING (Super Admin)
export const updateSetting = async (req, res) => {
  const { key, value, description } = req.body;
  try {
    let setting = await Setting.findOne({ key });
    if (setting) {
      setting.value = value;
      if (description) setting.description = description;
      await setting.save();
    } else {
      setting = await Setting.create({ key, value, description });
    }

    res.json({ message: "Setting updated successfully", setting });
  } catch (error) {
    res.status(500).json({ message: "Error saving settings", error: error.message });
  }
};


// ADMIN MANAGEMENT (Super Admin Dashboard Only)

// List all admins and super-admins
export const getAdminsList = async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ["admin", "super-admin"] } }).select("-password");
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: "Error loading admin list", error: error.message });
  }
};

// Create new Admin
export const createAdmin = async (req, res) => {
  const { name, mobileNumber, email, password, role } = req.body;
  try {
    const mobileExists = await User.findOne({ mobileNumber });
    if (mobileExists) {
      return res.status(400).json({ message: "Mobile number already in use" });
    }

    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const newAdmin = await User.create({
      name,
      mobileNumber,
      email,
      password,
      role: role || "admin",
      isActive: true
    });

    res.status(201).json({
      _id: newAdmin._id,
      name: newAdmin.name,
      mobileNumber: newAdmin.mobileNumber,
      email: newAdmin.email,
      role: newAdmin.role
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating admin account", error: error.message });
  }
};

// Edit Admin Details / Role
export const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, email, mobileNumber, role, isActive } = req.body;
  try {
    const adminUser = await User.findById(id);
    if (!adminUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (adminUser.role === "super-admin" && req.user.id !== adminUser._id.toString()) {
      return res.status(403).json({ message: "Cannot modify other Super Admins" });
    }

    if (name) adminUser.name = name;
    if (email) adminUser.email = email;
    if (mobileNumber) adminUser.mobileNumber = mobileNumber;
    if (role) adminUser.role = role;
    if (isActive !== undefined) adminUser.isActive = isActive;

    await adminUser.save();
    res.json({
      _id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      mobileNumber: adminUser.mobileNumber,
      role: adminUser.role,
      isActive: adminUser.isActive
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating admin account", error: error.message });
  }
};

// Delete Admin Account
export const deleteAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const adminUser = await User.findById(id);
    if (!adminUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (adminUser.role === "super-admin") {
      return res.status(400).json({ message: "Cannot delete Super Admin account" });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: "Admin account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting admin account", error: error.message });
  }
};


// ACTIVITY LOGS (Super Admin Audit)
export const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching activity logs", error: error.message });
  }
};
