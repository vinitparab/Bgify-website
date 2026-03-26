const express = require("express");
const router = express.Router();
const productModel = require("../../models/product-model");
const apiAuth = require("../../middlewares/apiAuth");
const apiOwner = require("../../middlewares/apiOwner");
const upload = require("../../config/multer-config");

// GET /api/products - Get all products with optional filters
router.get("/", apiAuth, async (req, res) => {
  try {
    const allProducts = await productModel.find();
    const prices = allProducts.map(p => p.price);
    const priceMin = prices.length > 0 ? Math.min(...prices) : 0;
    const priceMax = prices.length > 0 ? Math.max(...prices) : 10000;

    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const showDiscountedOnly = req.query.discount === 'true';
    const showNewCollection = req.query.new === 'true';

    let query = {};

    if (minPrice !== null || maxPrice !== null) {
      query.price = {};
      if (minPrice !== null) query.price.$gte = minPrice;
      if (maxPrice !== null) query.price.$lte = maxPrice;
    }

    if (showDiscountedOnly) {
      query.discount = { $gt: 0 };
    }

    let sortOptions = {};
    if (showNewCollection) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const mongoose = require('mongoose');
      const timestamp = Math.floor(thirtyDaysAgo.getTime() / 1000);
      try {
        const objectIdFromDate = mongoose.Types.ObjectId.createFromTime(timestamp);
        query._id = { $gte: objectIdFromDate };
      } catch (e) {
        const hexTimestamp = timestamp.toString(16) + "0000000000000000";
        query._id = { $gte: new mongoose.Types.ObjectId(hexTimestamp) };
      }
      sortOptions = { _id: -1 };
    }

    const products = showNewCollection
      ? await productModel.find(query).sort(sortOptions).select("-image")
      : await productModel.find(query).select("-image");

    res.json({
      products,
      priceMin,
      priceMax,
      minPrice: minPrice !== null ? minPrice : priceMin,
      maxPrice: maxPrice !== null ? maxPrice : priceMax,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products - Create product (owner only)
router.post("/", apiOwner, upload.single("image"), async (req, res) => {
  try {
    const { name, price, discount, stock, bgcolor, panelcolor, textcolor } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Product image is required" });
    }
    await productModel.create({
      image: req.file.buffer,
      name,
      price: Number(price),
      discount: Number(discount) || 0,
      stock: Number(stock) || 0,
      bgcolor,
      panelcolor,
      textcolor,
    });
    res.json({ success: true, message: "Product Created Successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products/:id/stock - Update stock (owner only)
router.post("/:id/stock", apiOwner, async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    product.stock = Number(req.body.stock) || 0;
    await product.save();
    res.json({ success: true, message: "Stock updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
