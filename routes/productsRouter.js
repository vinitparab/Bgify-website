const express = require("express");
const router = express.Router();
const upload = require("../config/multer-config");
const productModel = require("../models/product-model");

router.post("/create", upload.single("image"), async (req, res) => {
  const { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;

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

module.exports = router;