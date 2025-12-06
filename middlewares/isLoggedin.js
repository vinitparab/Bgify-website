const jwt = require("jsonwebtoken");
const { JWT_KEY } = require("../config/keys");
const userModel = require("../models/user-model");

module.exports = async function (req, res, next) {
  if (!req.cookies.token) {
    req.flash("error", "You need to login first");
    return res.redirect("/");
  }
  try {
    const secret = JWT_KEY || "development-jwt-secret";
    const decoded = jwt.verify(req.cookies.token, secret);
    const user = await userModel.findOne({ email: decoded.email }).select("-password");
    req.user = user;
    next();
  } catch (err) {
    req.flash("error", "Session expired, please login again");
    res.redirect("/");
  }
};