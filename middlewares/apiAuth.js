const jwt = require("jsonwebtoken");
const { JWT_KEY } = require("../config/keys");
const userModel = require("../models/user-model");

// API version of isLoggedin - returns JSON instead of redirecting
module.exports = async function (req, res, next) {
  if (!req.cookies.token) {
    return res.status(401).json({ success: false, message: "You need to login first" });
  }
  try {
    const secret = JWT_KEY || "development-jwt-secret";
    const decoded = jwt.verify(req.cookies.token, secret);
    const user = await userModel.findOne({ email: decoded.email }).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Session expired, please login again" });
  }
};
