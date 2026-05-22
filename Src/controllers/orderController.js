import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import Payment from "../models/Payment.js";
import Notification from "../models/Notification.js";

// CREATE ORDER
export const createOrder = async (req, res) => {
  const {
    items,
    shippingAddress,
    billingAddress,
    paymentMethod,
    couponCode,
    transactionId
  } = req.body;

  try {
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in order" });
    }

    let itemsPrice = 0;
    const finalItems = [];

    // Verify stock and price from DB
    for (const item of items) {
      const dbProduct = await Product.findById(item.product);
      if (!dbProduct || !dbProduct.isActive) {
        return res.status(400).json({ message: `Product not found: ${item.name}` });
      }

      // If item has a variant, verify variant stock if specific, else main stock
      let itemStock = dbProduct.stock;
      let finalPrice = dbProduct.discountPrice || dbProduct.price;

      if (item.selectedVariant) {
        const variant = dbProduct.variants.find(
          v =>
            (item.selectedVariant.size ? v.size === item.selectedVariant.size : true) &&
            (item.selectedVariant.color ? v.color === item.selectedVariant.color : true) &&
            (item.selectedVariant.weight ? v.weight === item.selectedVariant.weight : true)
        );
        if (variant) {
          if (variant.price) finalPrice = variant.price;
          itemStock = variant.stock;
        }
      }

      if (itemStock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product: ${item.name}` });
      }

      itemsPrice += finalPrice * item.quantity;

      // Prepare final verified item
      finalItems.push({
        product: item.product,
        name: dbProduct.name,
        image: dbProduct.images[0],
        quantity: item.quantity,
        price: finalPrice,
        selectedVariant: item.selectedVariant
      });
    }

    // Apply Coupon
    let discountPrice = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.isValid(itemsPrice)) {
        if (coupon.discountType === "Percentage") {
          discountPrice = (itemsPrice * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discountPrice > coupon.maxDiscount) {
            discountPrice = coupon.maxDiscount;
          }
        } else {
          discountPrice = coupon.discountValue;
        }
        // Increment coupon use count
        coupon.usageCount += 1;
        await coupon.save();
      }
    }

    // Tax calculation: GST (e.g. 18%)
    const taxPrice = Math.round(itemsPrice * 0.18 * 100) / 100;

    // Shipping charge: e.g. Free above Rs 500, else Rs 50
    const shippingPrice = itemsPrice - discountPrice > 500 ? 0 : 50;

    // Total Calculation
    const totalPrice = Math.max(0, itemsPrice + taxPrice + shippingPrice - discountPrice);

    // Create Order
    const order = new Order({
      user: req.user.id,
      items: finalItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Success", // Standard mock status
      itemsPrice,
      taxPrice,
      shippingPrice,
      discountPrice,
      totalPrice,
      couponCode: couponCode ? couponCode.toUpperCase() : undefined
    });

    const createdOrder = await order.save();

    // Deduct stock in DB
    for (const item of finalItems) {
      const dbProduct = await Product.findById(item.product);
      if (dbProduct) {
        if (item.selectedVariant) {
          const vIndex = dbProduct.variants.findIndex(
            v =>
              (item.selectedVariant.size ? v.size === item.selectedVariant.size : true) &&
              (item.selectedVariant.color ? v.color === item.selectedVariant.color : true) &&
              (item.selectedVariant.weight ? v.weight === item.selectedVariant.weight : true)
          );
          if (vIndex !== -1) {
            dbProduct.variants[vIndex].stock -= item.quantity;
          }
        }
        dbProduct.stock -= item.quantity;
        await dbProduct.save();
      }
    }

    // Create Payment log
    await Payment.create({
      order: createdOrder._id,
      user: req.user.id,
      transactionId: transactionId || "COD-MOCK-" + Date.now(),
      amount: totalPrice,
      gateway: paymentMethod,
      status: paymentMethod === "COD" ? "Pending" : "Success"
    });

    // Send notifications
    await Notification.create({
      user: req.user.id,
      title: "Order Placed Successfully",
      message: `Your order #${createdOrder._id} for Rs. ${totalPrice} has been placed.`,
      type: "Order"
    });

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: "Error placing order", error: error.message });
  }
};

// GET USER ORDERS (Customer History)
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error loading order history", error: error.message });
  }
};

// GET SINGLE ORDER DETAILS
export const getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findById(id).populate("user", "name email mobileNumber");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Enforce that only the customer who ordered or admins can view it
    if (order.user._id.toString() !== req.user.id && req.user.role === "customer") {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error loading order info", error: error.message });
  }
};

// GET ALL ORDERS (Admins)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "name email mobileNumber")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error loading all orders", error: error.message });
  }
};

// UPDATE ORDER STATUS (Admins)
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { orderStatus, paymentStatus, trackingNumber } = req.body;
  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
      if (orderStatus === "Delivered") {
        order.deliveredAt = Date.now();
        // If COD, mark paid on delivery
        if (order.paymentMethod === "COD") {
          order.paymentStatus = "Success";
          await Payment.findOneAndUpdate({ order: order._id }, { status: "Success" });
        }
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      await Payment.findOneAndUpdate({ order: order._id }, { status: paymentStatus });
    }

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    await order.save();

    // Notify customer
    await Notification.create({
      user: order.user,
      title: `Order Status Updated: ${order.orderStatus}`,
      message: `Your order #${order._id} status is now: ${order.orderStatus}.`,
      type: "Order"
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error updating order status", error: error.message });
  }
};

// REQUEST RETURN (Customer)
export const requestOrderReturn = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const order = await Order.findOne({ _id: id, user: req.user.id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.orderStatus !== "Delivered") {
      return res.status(400).json({ message: "Can only return orders that are already Delivered" });
    }

    order.returnRequestStatus = "Requested";
    order.returnRequestReason = reason;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error requesting return", error: error.message });
  }
};

// APPROVE/REJECT RETURN (Admin)
export const manageOrderReturn = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // "Approved" or "Rejected"
  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.returnRequestStatus !== "Requested") {
      return res.status(400).json({ message: "No active return request found for this order" });
    }

    order.returnRequestStatus = status;

    if (status === "Approved") {
      order.orderStatus = "Returned";
      order.paymentStatus = "Refunded";
      order.returnedAt = Date.now();
      order.refundedAt = Date.now();

      // Return items back to stock
      for (const item of order.items) {
        const dbProduct = await Product.findById(item.product);
        if (dbProduct) {
          if (item.selectedVariant) {
            const vIndex = dbProduct.variants.findIndex(
              v =>
                (item.selectedVariant.size ? v.size === item.selectedVariant.size : true) &&
                (item.selectedVariant.color ? v.color === item.selectedVariant.color : true) &&
                (item.selectedVariant.weight ? v.weight === item.selectedVariant.weight : true)
            );
            if (vIndex !== -1) {
              dbProduct.variants[vIndex].stock += item.quantity;
            }
          }
          dbProduct.stock += item.quantity;
          await dbProduct.save();
        }
      }

      // Update payment state
      await Payment.findOneAndUpdate({ order: order._id }, { status: "Refunded" });
    }

    await order.save();

    await Notification.create({
      user: order.user,
      title: `Return Request ${status}`,
      message: `Your return request for order #${order._id} was: ${status}.`,
      type: "Order"
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error managing return", error: error.message });
  }
};
