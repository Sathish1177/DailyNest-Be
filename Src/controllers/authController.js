import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "dailynest_jwt_secret_key_12345", {
    expiresIn: "30d"
  });
};

// Helper to decode Google ID Token without library calls
const decodeGoogleToken = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, "base64")
        .toString()
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error("Invalid Google token payload format");
  }
};

// Logging admin/user actions
const logActivity = async (userId, action, details, ip) => {
  try {
    const user = await User.findById(userId);
    if (user) {
      await ActivityLog.create({
        user: userId,
        userName: user.name,
        userEmail: user.email || "",
        action,
        details,
        ipAddress: ip || "127.0.0.1"
      });
    }
  } catch (err) {
    console.error("Log error:", err.message);
  }
};

// REGISTER
export const register = async (req, res) => {
  const { name, mobileNumber, email, password } = req.body;
  try {
    // Check if user exists
    const userExists = await User.findOne({ mobileNumber });
    if (userExists) {
      return res.status(400).json({ message: "Mobile number is already registered" });
    }

    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email is already registered" });
      }
    }

    // Set first registered user as super-admin (helps initialize backend admins)
    const isFirstUser = (await User.countDocuments({})) === 0;
    const role = isFirstUser ? "super-admin" : "customer";

    const user = await User.create({
      name,
      mobileNumber,
      email,
      password,
      role
    });

    await logActivity(user._id, "Register", `Registered account as role: ${role}`, req.ip);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      mobileNumber: user.mobileNumber,
      email: user.email,
      role: user.role,
      store: user.store,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during registration", error: error.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  const { mobileNumber, password } = req.body;
  try {
    const user = await User.findOne({ mobileNumber });
    if (!user) {
      return res.status(401).json({ message: "Invalid mobile number or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Your account is suspended. Please contact support." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid mobile number or password" });
    }

    await logActivity(user._id, "Login", "Logged in manually via mobile", req.ip);

    res.json({
      _id: user._id,
      name: user.name,
      mobileNumber: user.mobileNumber,
      email: user.email,
      role: user.role,
      store: user.store,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login", error: error.message });
  }
};

// GOOGLE OAUTH
export const googleLogin = async (req, res) => {
  const { credential } = req.body;
  try {
    if (!credential) {
      return res.status(400).json({ message: "Google token credential is required" });
    }

    const payload = decodeGoogleToken(credential);
    const { sub: googleId, email, name, picture } = payload;

    // Check if user already exists with googleId
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user with same email exists
      if (email) {
        user = await User.findOne({ email });
      }

      if (user) {
        // Link google account to existing user
        user.googleId = googleId;
        await user.save();
      } else {
        // Create new user (Generate a mock mobile number to satisfy schema validation if registering first time)
        const mockMobile = "G-" + Math.floor(100000000 + Math.random() * 900000000);
        user = await User.create({
          name,
          email,
          googleId,
          mobileNumber: mockMobile,
          role: "customer"
        });
      }
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Your account is suspended" });
    }

    await logActivity(user._id, "Google Login", "Logged in via Google OAuth", req.ip);

    res.json({
      _id: user._id,
      name: user.name,
      mobileNumber: user.mobileNumber,
      email: user.email,
      role: user.role,
      store: user.store,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: "Google Authentication failed", error: error.message });
  }
};

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  const { mobileNumber } = req.body;
  try {
    const user = await User.findOne({ mobileNumber });
    if (!user) {
      return res.status(404).json({ message: "User with this mobile number does not exist" });
    }

    // Generate reset token (in production we send via SMS/Email, here we return it for testing/mock)
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    await user.save();

    res.json({
      message: "Reset token generated successfully. Send this token to reset your password.",
      resetToken // Returned in response body for ease of demonstration
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating reset token", error: error.message });
  }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await logActivity(user._id, "Reset Password", "Reset password via token successfully", req.ip);

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password", error: error.message });
  }
};

// GET USER PROFILE
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};

// UPDATE USER PROFILE
export const updateProfile = async (req, res) => {
  const { name, email, mobileNumber } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (mobileNumber && mobileNumber !== user.mobileNumber) {
      const mobileExists = await User.findOne({ mobileNumber });
      if (mobileExists) {
        return res.status(400).json({ message: "Mobile number already in use" });
      }
      user.mobileNumber = mobileNumber;
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    user.name = name || user.name;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      mobileNumber: user.mobileNumber,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};

// CHANGE PASSWORD
export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error changing password", error: error.message });
  }
};

// ADDRESS CRUD
export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: "Error loading addresses", error: error.message });
  }
};

export const addAddress = async (req, res) => {
  const { name, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;
  try {
    const user = await User.findById(req.user.id);

    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    const newAddress = {
      name,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country: country || "India",
      isDefault: isDefault || user.addresses.length === 0
    };

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: "Error adding address", error: error.message });
  }
};

export const updateAddress = async (req, res) => {
  const { addressId } = req.params;
  const { name, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const address = user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    address.name = name || address.name;
    address.phone = phone || address.phone;
    address.addressLine1 = addressLine1 || address.addressLine1;
    address.addressLine2 = addressLine2 || address.addressLine2;
    address.city = city || address.city;
    address.state = state || address.state;
    address.postalCode = postalCode || address.postalCode;
    address.country = country || address.country;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: "Error updating address", error: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  const { addressId } = req.params;
  try {
    const user = await User.findById(req.user.id);
    const address = user.addresses.id(addressId);
    
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const wasDefault = address.isDefault;
    user.addresses.pull(addressId);

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: "Error deleting address", error: error.message });
  }
};
