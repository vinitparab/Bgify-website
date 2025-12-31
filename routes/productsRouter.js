const express = require("express");
const router = express.Router();
const upload = require("../config/multer-config");
const productModel = require("../models/product-model");
const isOwner = require("../middlewares/isOwner");

router.post("/create", isOwner, upload.single("image"), async (req, res) => {
  const { name, price, discount, stock, bgcolor, panelcolor, textcolor } = req.body;

  if (!req.file) {
    req.flash("error", "Product image is required");
    return res.redirect("/owners/createproducts");
  }

  try {
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
    req.flash("success", "Product Created Successfully");
    res.redirect("/owners/admin");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/owners/createproducts");
  }
});

// Update product stock
router.post("/update-stock/:productid", isOwner, async (req, res) => {
  try {
    const { stock } = req.body;
    const product = await productModel.findById(req.params.productid);
    
    if (!product) {
      req.flash("error", "Product not found");
      return res.redirect("/owners/admin");
    }
    
    // Set stock value (handles both new and existing products)
    product.stock = Number(stock) || 0;
    await product.save();
    
    req.flash("success", "Stock updated successfully");
    res.redirect("/owners/admin");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/owners/admin");
  }
});

// Initialize stock for all products that don't have it (optional helper route)
router.post("/initialize-stock", isOwner, async (req, res) => {
  try {
    const { defaultStock } = req.body;
    const defaultStockValue = Number(defaultStock) || 0;
    
    // Update all products that don't have stock field or have null/undefined stock
    const result = await productModel.updateMany(
      { $or: [{ stock: { $exists: false } }, { stock: null }, { stock: undefined }] },
      { $set: { stock: defaultStockValue } }
    );
    
    req.flash("success", `Stock initialized for ${result.modifiedCount} products`);
    res.redirect("/owners/admin");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/owners/admin");
  }
});

module.exports = router;