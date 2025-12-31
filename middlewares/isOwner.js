const jwt = require("jsonwebtoken");
const { JWT_KEY } = require("../config/keys");
const ownerModel = require("../models/owner-model");

module.exports = async function (req, res, next) {
  // Check for owner token (different from user token)
  if (!req.cookies.ownerToken) {
    req.flash("error", "You need to login as admin first");
    return res.redirect("/owners/login");
  }
  try {
    const secret = JWT_KEY || "development-jwt-secret";
    const decoded = jwt.verify(req.cookies.ownerToken, secret);
    
    // Verify that the decoded email belongs to an owner
    const owner = await ownerModel.findOne({ email: decoded.email }).select("-password");
    
    if (!owner) {
      req.flash("error", "Unauthorized access. Admin access required.");
      res.cookie("ownerToken", ""); // Clear invalid token
      return res.redirect("/owners/login");
    }
    
    req.owner = owner;
    next();
  } catch (err) {
    req.flash("error", "Admin session expired, please login again");
    res.cookie("ownerToken", ""); // Clear invalid token
    res.redirect("/owners/login");
  }
};

