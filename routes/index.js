const express = require("express");
const router = express.Router();
const isLoggedin = require("../middlewares/isLoggedin");
const userModel = require("../models/user-model");
const productModel = require("../models/product-model");

// Home
router.get("/", (req, res) => {
  let error = req.flash("error");
  let success = req.flash("success");

  res.render("index", { error, success, loggedin: false });
});

// Shop page
router.get("/shop", isLoggedin, async (req, res) => {
  const products = await productModel.find();
  const success = req.flash("success");
  const error = req.flash("error");
  
  
  res.render("shop", { products, success, error });
});

router.get("/cart", isLoggedin, async (req, res) => {
  let user = await userModel.findOne({email:req.user.email}).populate("cart.product")
  res.render("cart",{user} );
});
// Example: Add to cart route
router.get("/addtocart/:productid", isLoggedin, async (req, res) => {
  let user = await userModel.findOne({email: req.user.email});
  let existingItem = user.cart.find(item => 
    item.product.toString() === req.params.productid
  );
  
  if (existingItem) {
    // If product exists, increase quantity by 1
    existingItem.quantity += 1;
  } else {
    // If product doesn't exist, add new item to cart
    user.cart.push({
      product: req.params.productid,
      quantity: 1
    });
  }
  

  
  await user.save();
  req.flash("success","Added to cart")
 
  res.redirect("/shop");
});


// Add these routes to your router file

// Remove item from cart
router.post("/cart/remove/:productid", isLoggedin, async (req, res) => {
  let user = await userModel.findOne({email: req.user.email});
  user.cart = user.cart.filter(item => item.product.toString() !== req.params.productid);
  await user.save();
  res.redirect("/cart");
});

// Increase quantity
router.post("/cart/increase/:productid", isLoggedin, async (req, res) => {
  let user = await userModel.findOne({email: req.user.email});
  let item = user.cart.find(item => item.product.toString() === req.params.productid);
  if (item) {
    item.quantity += 1;
    await user.save();
  }
  res.redirect("/cart");
});

// Decrease quantity - removes item when quantity reaches 0
router.post("/cart/decrease/:productid", isLoggedin, async (req, res) => {
  let user = await userModel.findOne({email: req.user.email});
  let item = user.cart.find(item => item.product.toString() === req.params.productid);
  
  if (item) {
    item.quantity -= 1;
    
    // Remove item from cart if quantity becomes 0
    if (item.quantity <= 0) {
      user.cart = user.cart.filter(item => item.product.toString() !== req.params.productid);
    }
    
    await user.save();
  }
  
  res.redirect("/cart");
});

// Apply promo code (optional)
router.post("/cart/apply-promo", isLoggedin, async (req, res) => {
  // Add your promo code logic here
  res.redirect("/cart");
});



module.exports = router;
