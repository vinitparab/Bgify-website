const jwt = require("jsonwebtoken");
const { JWT_KEY } = require("../config/keys");
const ownerModel = require("../models/owner-model");

// API version of isOwner middleware - returns JSON instead of redirecting
module.exports = async function (req, res, next) {
  if (!req.cookies.ownerToken) {
    return res.status(401).json({ success: false, message: "Admin login required" });
  }
  try {
    const secret = JWT_KEY || "development-jwt-secret";
    const decoded = jwt.verify(req.cookies.ownerToken, secret);
    const owner = await ownerModel.findOne({ email: decoded.email }).select("-password");
    if (!owner) {
      res.cookie("ownerToken", "");
      return res.status(401).json({ success: false, message: "Unauthorized access" });
    }
    req.owner = owner;
    next();
  } catch (err) {
    res.cookie("ownerToken", "");
    return res.status(401).json({ success: false, message: "Admin session expired" });
  }
};
