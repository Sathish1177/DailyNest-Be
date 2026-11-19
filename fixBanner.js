import mongoose from "mongoose";
import dotenv from "dotenv";
import Banner from "./Src/models/Banner.js";

dotenv.config();

const fixBanner = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Banner.updateOne(
      { _id: "6a102ff342fc001263def7d5" },
      { $set: { link: "/shop" } }
    );
    // Also check any other banners with chatgpt link
    await Banner.updateMany(
      { link: { $regex: /chatgpt/i } },
      { $set: { link: "/shop" } }
    );
    console.log("✅ Successfully updated banner link to /shop in MongoDB!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixBanner();
