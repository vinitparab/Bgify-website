const express = require("express");
const router = express.Router();
const userModel = require("../../models/user-model");
const productModel = require("../../models/product-model");
const apiAuth = require("../../middlewares/apiAuth");

// GET /api/cart - Get user's cart with populated products
router.get("/", apiAuth, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email }).populate("cart.product");
    // Remove the image buffer from populated products for performance
    const cart = user.cart.map(item => {
      if (item.product) {
        const prod = item.product.toObject();
        delete prod.image;
        return { ...item.toObject(), product: prod };
      }
      return item;
    });
    res.json({
      cart,
      user: { fullname: user.fullname, email: user.email, contact: user.contact }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/cart/add/:productid - Add to cart
router.post("/add/:productid", apiAuth, async (req, res) => {
  try {
    const product = await productModel.findById(req.params.productid);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    const productStock = product.stock ?? 0;
    if (productStock <= 0) {
      return res.status(400).json({ success: false, message: "Product is out of stock" });
    }

    const user = await userModel.findOne({ email: req.user.email });
    const existingItem = user.cart.find(item => item.product.toString() === req.params.productid);

    if (existingItem) {
      if (existingItem.quantity >= productStock) {
        return res.status(400).json({ success: false, message: `Only ${productStock} items available in stock` });
      }
      existingItem.quantity += 1;
    } else {
      user.cart.push({ product: req.params.productid, quantity: 1 });
    }

    await user.save();
    res.json({ success: true, message: "Added to cart" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add to cart" });
  }
});

// POST /api/cart/remove/:productid - Remove from cart
router.post("/remove/:productid", apiAuth, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });
    user.cart = user.cart.filter(item => item.product.toString() !== req.params.productid);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/cart/increase/:productid - Increase quantity
router.post("/increase/:productid", apiAuth, async (req, res) => {
  try {
    const product = await productModel.findById(req.params.productid);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    const productStock = product.stock ?? 0;
    const user = await userModel.findOne({ email: req.user.email });
    const item = user.cart.find(item => item.product.toString() === req.params.productid);

    if (item) {
      if (item.quantity >= productStock) {
        return res.status(400).json({ success: false, message: `Only ${productStock} items available` });
      }
      item.quantity += 1;
      await user.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/cart/decrease/:productid - Decrease quantity
router.post("/decrease/:productid", apiAuth, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });
    const item = user.cart.find(item => item.product.toString() === req.params.productid);

    if (item) {
      item.quantity -= 1;
      if (item.quantity <= 0) {
        user.cart = user.cart.filter(i => i.product.toString() !== req.params.productid);
      }
      await user.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
