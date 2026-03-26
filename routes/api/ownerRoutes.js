const express = require("express");
const router = express.Router();
const ownerModel = require("../../models/owner-model");
const productModel = require("../../models/product-model");
const userModel = require("../../models/user-model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../../utils/generateToken");
const apiOwner = require("../../middlewares/apiOwner");

// POST /api/owner/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({ success: false, message: "Email and password are required" });
    }

    const owner = await ownerModel.findOne({ email });
    if (!owner) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    let validPassword = false;
    if (owner.password && owner.password.length > 20) {
      validPassword = await bcrypt.compare(password, owner.password);
    } else {
      if (owner.password === password) {
        validPassword = true;
        const salt = await bcrypt.genSalt(10);
        owner.password = await bcrypt.hash(password, salt);
        await owner.save();
      }
    }

    if (validPassword) {
      const token = generateToken(owner);
      res.cookie("ownerToken", token);
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Invalid email or password" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

// POST /api/owner/logout
router.post("/logout", (req, res) => {
  res.cookie("ownerToken", "");
  res.json({ success: true });
});

// GET /api/owner/admin - Get admin dashboard data
router.get("/admin", apiOwner, async (req, res) => {
  try {
    const products = await productModel.find().select("-image");
    res.json({ products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/owner/orders - Get all orders from all users
router.get("/orders", apiOwner, async (req, res) => {
  try {
    const users = await userModel.find({ "orders.0": { $exists: true } });
    let allOrders = [];

    for (const user of users) {
      for (const order of user.orders) {
        // Fetch product info to show in the list
        const populatedItems = await Promise.all(order.items.map(async (item) => {
          if (item.product) {
            const product = await productModel.findById(item.product).select("-image");
            return { ...item, product };
          }
          return item;
        }));

        allOrders.push({
          ...order,
          items: populatedItems,
          userId: user._id,
        });
      }
    }

    // Sort by date descending (newest first)
    allOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

    res.json({ success: true, orders: allOrders });
  } catch (err) {
    console.error("Error fetching admin orders:", err);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

// POST /api/owner/orders/update-status - Update order status
router.post("/orders/update-status", apiOwner, async (req, res) => {
  try {
    const { orderId, userId, status } = req.body;
    
    if (!orderId || !userId || !status) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const orderIndex = user.orders.findIndex(o => o.orderId === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    user.orders[orderIndex].status = status;
    user.markModified('orders'); // Important for mixed array updates in Mongoose
    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ success: false, message: "Failed to update order status" });
  }
});

module.exports = router;


