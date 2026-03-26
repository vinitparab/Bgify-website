const express = require("express");
const router = express.Router();
const ownerModel = require("../../models/owner-model");
const productModel = require("../../models/product-model");
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

module.exports = router;


