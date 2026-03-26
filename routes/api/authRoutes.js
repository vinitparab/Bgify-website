const express = require("express");
const router = express.Router();
const userModel = require("../../models/user-model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../../utils/generateToken");
const apiAuth = require("../../middlewares/apiAuth");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, fullname, password } = req.body;
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "You already have an account, please Login" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await userModel.create({ email, fullname, password: hash });
    const token = generateToken(user);
    res.cookie("token", token);
    res.json({ success: true, message: "Registered Successfully", user: { fullname: user.fullname, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "You need to Register First" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (validPassword) {
      const token = generateToken(user);
      res.cookie("token", token);
      res.json({ success: true, user: { fullname: user.fullname, email: user.email } });
    } else {
      res.json({ success: false, message: "Email or Password is incorrect" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/logout
router.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.json({ success: true });
});

// GET /api/auth/me - Check if user is logged in
router.get("/me", apiAuth, (req, res) => {
  res.json({ success: true, user: { fullname: req.user.fullname, email: req.user.email, contact: req.user.contact } });
});

module.exports = router;
