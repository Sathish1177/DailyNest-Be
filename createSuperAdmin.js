import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./Src/models/User.js";

dotenv.config();

const createOrUpdateSuperAdmin = async () => {
  const mobileNumber = process.argv[2] || "9025585770";
  const password = process.argv[3] || "admin12345";
  const name = process.argv[4] || "Super Admin";
  const email = process.argv[5] || "admin@dailynest.com";

  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI is missing in .env file");
      process.exit(1);
    }

    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected successfully!");

    let user = await User.findOne({ mobileNumber });

    if (user) {
      user.name = name;
      user.email = email;
      user.password = password; // Will be hashed automatically by pre-save hook
      user.role = "super-admin";
      user.isActive = true;
      await user.save();
      console.log("\n========================================");
      console.log("🎉 Existing User updated to SUPER ADMIN!");
      console.log("========================================");
    } else {
      user = new User({
        name,
        mobileNumber,
        email,
        password,
        role: "super-admin",
        isActive: true
      });
      await user.save();
      console.log("\n========================================");
      console.log("🎉 New SUPER ADMIN created successfully!");
      console.log("========================================");
    }

    console.log(`📱 Mobile Number: ${mobileNumber}`);
    console.log(`🔑 Password     : ${password}`);
    console.log(`👑 Role         : super-admin`);
    console.log(`🌐 Login URL    : http://localhost:5173/adminlogin`);
    console.log("========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating Super Admin:", error.message);
    process.exit(1);
  }
};

createOrUpdateSuperAdmin();

