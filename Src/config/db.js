import mongoose from "mongoose";
import User from "../models/User.js";

const seedDefaultUsers = async () => {
  try {
    // 1. Super Admin
    const superAdminMobile = "9025585770";
    const superAdminEmail = "lsathish017@gmail.com";
    let superAdmin = await User.findOne({
      $or: [{ mobileNumber: superAdminMobile }, { email: superAdminEmail }]
    });
    
    if (!superAdmin) {
      await User.create({
        name: "Super Admin",
        mobileNumber: superAdminMobile,
        email: superAdminEmail,
        password: "MYadminDN@2027",
        role: "super-admin"
      });
      console.log("👥 Default Super Admin created: 9025585770 / MYadminDN@2027");
    } else {
      superAdmin.name = "Super Admin";
      superAdmin.mobileNumber = superAdminMobile;
      superAdmin.email = superAdminEmail;
      superAdmin.password = "MYadminDN@2027";
      superAdmin.role = "super-admin";
      await superAdmin.save();
      console.log("👥 Default Super Admin verified/updated: 9025585770 / MYadminDN@2027");
    }

    // 2. Admin
    const adminMobile = "9025585777";
    const adminEmail = "admin@dailynest.com";
    let admin = await User.findOne({
      $or: [{ mobileNumber: adminMobile }, { email: adminEmail }]
    });

    if (!admin) {
      await User.create({
        name: "Admin User",
        mobileNumber: adminMobile,
        email: adminEmail,
        password: "MYDN@2027",
        role: "admin"
      });
      console.log("👥 Default Admin created: 9025585777 / MYDN@2027");
    } else {
      admin.name = "Admin User";
      admin.mobileNumber = adminMobile;
      admin.email = adminEmail;
      admin.password = "MYDN@2027";
      admin.role = "admin";
      await admin.save();
      console.log("👥 Default Admin verified/updated: 9025585777 / MYDN@2027");
    }
  } catch (error) {
    console.error("❌ Error seeding default users:", error.message);
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
    
    // Seed default users
    await seedDefaultUsers();
  } catch (error) {
    console.log("❌ Database Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;