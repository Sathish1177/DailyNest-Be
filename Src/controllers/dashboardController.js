import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

// GET ANALYTICS DATA (Admin & Super Admin Dashboard)
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Total revenue (from delivered or successful payments)
    const salesAggregate = await Order.aggregate([
      { $match: { paymentStatus: "Success" } },
      { $group: { _id: null, totalSales: { $sum: "$totalPrice" } } }
    ]);
    const totalSales = salesAggregate.length > 0 ? salesAggregate[0].totalSales : 0;

    // 2. Count statistics
    const totalOrders = await Order.countDocuments({});
    const totalProducts = await Product.countDocuments({});
    const totalCustomers = await User.countDocuments({ role: "customer" });

    // 3. Low stock alerts (stock <= 5)
    const lowStockProducts = await Product.find({ stock: { $lte: 5 } }).select("name stock SKU price");

    // 4. Order status breakdown
    const orderStatusBreakdown = await Order.aggregate([
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
    ]);

    // 5. Recent 5 orders
    const recentOrders = await Order.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5);

    // 6. Revenue trend (monthly)
    const monthlyRevenue = await Order.aggregate([
      { $match: { paymentStatus: "Success" } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 }
    ]);

    res.json({
      totalSales,
      totalOrders,
      totalProducts,
      totalCustomers,
      lowStockProducts,
      orderStatusBreakdown,
      recentOrders,
      monthlyRevenue
    });
  } catch (error) {
    res.status(500).json({ message: "Error calculating dashboard metrics", error: error.message });
  }
};
