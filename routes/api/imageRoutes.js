        const express = require("express");
const router = express.Router();
const productModel = require("../../models/product-model");

// GET /api/images/product/:id - Serve product image as JPEG
router.get("/product/:id", async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id).select("image");
    if (!product || !product.image) {
      return res.status(404).send("Image not found");
    }
    res.set("Content-Type", "image/jpeg");
    res.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
    res.send(product.image);
  } catch (err) {
    res.status(500).send("Error loading image");
  }
});

module.exports = router;
