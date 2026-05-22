import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Protect routes - Verify user is logged in
export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized to access this resource" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dailynest_jwt_secret_key_12345");

    // Get user from token
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "The user belonging to this token no longer exists" });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "User account is suspended" });
    }

    // Grant access
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token verification failed", error: error.message });
  }
};

// Restrict access to specific roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role (${req.user ? req.user.role : "none"}) is not authorized to access this resource`
      });
    }
    next();
  };
};
