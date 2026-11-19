import mongoose from "mongoose";
import dotenv from "dotenv";
import Banner from "./Src/models/Banner.js";

dotenv.config();

const checkBanners = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const banners = await Banner.find({});
    console.log("Database Banners:", JSON.stringify(banners, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkBanners();
