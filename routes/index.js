const express = require("express");
const router = express.Router();
const isLoggedin = require("../middlewares/isLoggedin");
const userModel = require("../models/user-model");
const productModel = require("../models/product-model");
const ownerModel = require("../models/owner-model");

// Home
router.get("/", (req, res) => {
  let error = req.flash("error");
  let success = req.flash("success");

  res.render("index", { error, success, loggedin: false });
});

// Shop page
router.get("/shop", isLoggedin, async (req, res) => {
  const success = req.flash("success");
  const error = req.flash("error");
  
  // Get all products to calculate price range
  const allProducts = await productModel.find();
  const prices = allProducts.map(p => p.price);
  const priceMin = prices.length > 0 ? Math.min(...prices) : 0;
  const priceMax = prices.length > 0 ? Math.max(...prices) : 10000;
  
  // Get price filter parameters
  const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
  const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
  
  // Get filter parameters
  const showDiscountedOnly = req.query.discount === 'true';
  const showNewCollection = req.query.new === 'true';
  
  // Build query
  let query = {};
  
  // Price filter
  if (minPrice !== null || maxPrice !== null) {
    query.price = {};
    if (minPrice !== null) {
      query.price.$gte = minPrice;
    }
    if (maxPrice !== null) {
      query.price.$lte = maxPrice;
    }
  }
  
  // Discount filter - only show products with discount > 0
  if (showDiscountedOnly) {
    query.discount = { $gt: 0 };
  }
  
  // New Collection filter - show products from last 30 days, sorted by newest first
  let sortOptions = {};
  if (showNewCollection) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // MongoDB ObjectId contains timestamp, create ObjectId from 30 days ago
    const mongoose = require('mongoose');
    const timestamp = Math.floor(thirtyDaysAgo.getTime() / 1000);
    
    // Create ObjectId from timestamp (compatible with all mongoose versions)
    try {
      const objectIdFromDate = mongoose.Types.ObjectId.createFromTime(timestamp);
      query._id = { $gte: objectIdFromDate };
    } catch (e) {
      // Fallback: use hex string method
      const hexTimestamp = timestamp.toString(16) + "0000000000000000";
      query._id = { $gte: new mongoose.Types.ObjectId(hexTimestamp) };
    }
    
    sortOptions = { _id: -1 }; // Sort by _id descending (newest first)
  }
  
  const products = showNewCollection 
    ? await productModel.find(query).sort(sortOptions)
    : await productModel.find(query);
  
  res.render("shop", { 
    products, 
    success, 
    error,
    minPrice: minPrice !== null ? minPrice : priceMin,
    maxPrice: maxPrice !== null ? maxPrice : priceMax,
    priceMin: priceMin,
    priceMax: priceMax,
    showDiscountedOnly: showDiscountedOnly,
    showNewCollection: showNewCollection
  });
});

router.get("/cart", isLoggedin, async (req, res) => {
  let user = await userModel.findOne({email:req.user.email}).populate("cart.product")
  res.render("cart",{user} );
});
// Example: Add to cart route
router.get("/addtocart/:productid", isLoggedin, async (req, res) => {
  try {
    // Check product stock
    const product = await productModel.findById(req.params.productid);
    if (!product) {
      if (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      req.flash("error", "Product not found");
      return res.redirect("/shop");
    }
    
    // Handle missing stock field - default to 0 if not present
    const productStock = product.stock ?? 0;
    
    if (productStock <= 0) {
      if (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1) {
        return res.status(400).json({ success: false, message: "Product is out of stock" });
      }
      req.flash("error", "Product is out of stock");
      return res.redirect("/shop");
    }
    
    let user = await userModel.findOne({email: req.user.email});
    let existingItem = user.cart.find(item => 
      item.product.toString() === req.params.productid
    );
    
    if (existingItem) {
      // Check if adding one more would exceed stock
      if (existingItem.quantity >= productStock) {
        if (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1) {
          return res.status(400).json({ success: false, message: `Only ${product.stock} items available in stock` });
        }
        req.flash("error", `Only ${product.stock} items available in stock`);
        return res.redirect("/shop");
      }
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
    
    // Check if request is AJAX/JSON
    if (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1) {
      return res.json({ success: true, message: "Added to cart" });
    }
    
    // Fallback for non-AJAX requests
    req.flash("success","Added to cart");
    res.redirect("/shop");
  } catch (error) {
    if (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1) {
      return res.status(500).json({ success: false, message: "Failed to add to cart" });
    }
    req.flash("error", "Failed to add to cart");
    res.redirect("/shop");
  }
});


// Add these routes to your router file

// Remove item from cart
router.post("/cart/remove/:productid", isLoggedin, async (req, res) => {
  try {
    let user = await userModel.findOne({email: req.user.email});
    user.cart = user.cart.filter(item => item.product.toString() !== req.params.productid);
    await user.save();
    
    if (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1) {
      return res.json({ success: true });
    }
    res.redirect("/cart");
  } catch (error) {
    if (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1) {
      return res.status(500).json({ success: false, error: error.message });
    }
    req.flash("error", "Failed to remove item");
    res.redirect("/cart");
  }
});

// Increase quantity
router.post("/cart/increase/:productid", isLoggedin, async (req, res) => {
  try {
    // Check product stock
    const product = await productModel.findById(req.params.productid);
    if (!product) {
      if (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      req.flash("error", "Product not found");
      return res.redirect("/cart");
    }
    
    // Handle missing stock field - default to 0 if not present
    const productStock = product.stock ?? 0;
    
    let user = await userModel.findOne({email: req.user.email});
    let item = user.cart.find(item => item.product.toString() === req.params.productid);
    
    if (item) {
      // Check if increasing quantity would exceed stock
      if (item.quantity >= productStock) {
        if (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1) {
          return res.status(400).json({ success: false, message: `Only ${product.stock} items available in stock` });
        }
        req.flash("error", `Only ${product.stock} items available in stock`);
        return res.redirect("/cart");
      }
      item.quantity += 1;
      await user.save();
    }
    
    if (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1) {
      return res.json({ success: true });
    }
    res.redirect("/cart");
  } catch (error) {
    if (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1) {
      return res.status(500).json({ success: false, error: error.message });
    }
    req.flash("error", "Failed to update quantity");
    res.redirect("/cart");
  }
});

// Decrease quantity - removes item when quantity reaches 0
router.post("/cart/decrease/:productid", isLoggedin, async (req, res) => {
  try {
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
    
    if (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1) {
      return res.json({ success: true });
    }
    res.redirect("/cart");
  } catch (error) {
    if (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1) {
      return res.status(500).json({ success: false, error: error.message });
    }
    req.flash("error", "Failed to update quantity");
    res.redirect("/cart");
  }
});

// Promo code feature removed - COD only

// Checkout page
router.get("/checkout", isLoggedin, async (req, res) => {
  try {
    const user = await userModel.findOne({email: req.user.email}).populate("cart.product");
    const success = req.flash("success");
    const error = req.flash("error");
    
    // Calculate totals
    let subtotal = 0;
    let originalTotal = 0;
    let totalItems = 0;
    
    user.cart.forEach(function(item) {
      if (item.product) {
        const itemPrice = item.product.discount && item.product.discount > 0
          ? item.product.price - (item.product.price * item.product.discount / 100)
          : item.product.price;
        subtotal += Math.round(itemPrice * item.quantity);
        originalTotal += item.product.price * item.quantity;
        totalItems += item.quantity;
      }
    });
    
    const totalSavings = originalTotal - subtotal;
    
    if (user.cart.length === 0 || !user.cart.some(item => item.product)) {
      req.flash("error", "Your cart is empty");
      return res.redirect("/cart");
    }
    
    res.render("checkout", {
      user,
      subtotal,
      originalTotal,
      totalSavings,
      totalItems,
      success,
      error
    });
  } catch (error) {
    req.flash("error", "Failed to load checkout page");
    res.redirect("/cart");
  }
});

// Place order
router.post("/checkout", isLoggedin, async (req, res) => {
  try {
    const { fullname, email, contact, address, city, state, pincode, paymentMethod } = req.body;
    
    // Validate required fields
    if (!fullname || !email || !contact || !address || !city || !state || !pincode || !paymentMethod) {
      req.flash("error", "Please fill all required fields");
      return res.redirect("/checkout");
    }
    
    const user = await userModel.findOne({email: req.user.email}).populate("cart.product");
    
    if (user.cart.length === 0 || !user.cart.some(item => item.product)) {
      req.flash("error", "Your cart is empty");
      return res.redirect("/cart");
    }
    
    // Validate stock availability and calculate order total
    let orderTotal = 0;
    const orderItems = [];
    
    // Check stock for all items before processing
    for (let item of user.cart) {
      if (item.product) {
        const product = await productModel.findById(item.product._id);
        if (!product) {
          req.flash("error", `Product ${item.product.name} not found`);
          return res.redirect("/cart");
        }
        // Handle missing stock field - default to 0 if not present
        const productStock = product.stock ?? 0;
        if (productStock < item.quantity) {
          req.flash("error", `Insufficient stock for ${item.product.name}. Only ${productStock} available.`);
          return res.redirect("/cart");
        }
      }
    }
    
    // Process order and reduce stock
    for (let item of user.cart) {
      if (item.product) {
        const product = await productModel.findById(item.product._id);
        const itemPrice = item.product.discount && item.product.discount > 0
          ? item.product.price - (item.product.price * item.product.discount / 100)
          : item.product.price;
        const finalPrice = Math.round(itemPrice * item.quantity);
        orderTotal += finalPrice;
        
        orderItems.push({
          product: item.product._id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          discount: item.product.discount || 0,
          finalPrice: finalPrice
        });
        
        // Reduce stock (handle missing stock field)
        const currentStock = product.stock ?? 0;
        product.stock = Math.max(0, currentStock - item.quantity);
        await product.save();
      }
    }
    
    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Create order object
    const order = {
      orderId: orderId,
      items: orderItems,
      total: orderTotal,
      shippingAddress: {
        fullname,
        email,
        contact,
        address,
        city,
        state,
        pincode
      },
      paymentMethod,
      status: paymentMethod === 'cod' ? 'pending' : 'paid',
      orderDate: new Date(),
      customerName: fullname,
      customerEmail: email
    };
    
    // Add order to user's orders array
    user.orders.push(order);
    
    // Clear cart
    user.cart = [];
    
    await user.save();
    
    // Notify all owners about the new order
    const owners = await ownerModel.find();
    const notification = {
      type: 'new_order',
      message: `New order #${orderId} placed by ${fullname} (${email})`,
      orderId: orderId,
      orderTotal: orderTotal,
      customerName: fullname,
      customerEmail: email,
      orderDate: new Date(),
      read: false
    };
    
    for (let owner of owners) {
      if (!owner.notifications) {
        owner.notifications = [];
      }
      owner.notifications.unshift(notification); // Add to beginning
      // Keep only last 50 notifications
      if (owner.notifications.length > 50) {
        owner.notifications = owner.notifications.slice(0, 50);
      }
      await owner.save();
    }
    
    // Redirect to order success page
    res.redirect(`/order-success/${orderId}`);
  } catch (error) {
    console.error("Order placement error:", error);
    req.flash("error", "Failed to place order. Please try again.");
    res.redirect("/checkout");
  }
});

// Order success page
router.get("/order-success/:orderId", isLoggedin, async (req, res) => {
  try {
    const user = await userModel.findOne({email: req.user.email});
    
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/orders");
    }
    
    // Find order in user's orders array by orderId
    const order = user.orders.find(o => o.orderId === req.params.orderId);
    
    if (!order) {
      req.flash("error", "Order not found");
      return res.redirect("/orders");
    }
    
    // Populate product details for order items
    const populatedItems = await Promise.all(order.items.map(async (item) => {
      if (item.product) {
        const product = await productModel.findById(item.product);
        return {
          ...item,
          product: product
        };
      }
      return item;
    }));
    
    // Create order object with populated items
    const populatedOrder = {
      ...order,
      items: populatedItems
    };
    
    // Calculate estimated delivery date (5-7 business days)
    const orderDate = order.orderDate instanceof Date ? order.orderDate : new Date(order.orderDate);
    const estimatedDeliveryDate = new Date(orderDate);
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);
    
    res.render("order-success", {
      order: populatedOrder,
      estimatedDeliveryDate,
      loggedin: true
    });
  } catch (error) {
    console.error("Order success page error:", error);
    req.flash("error", "Failed to load order details");
    res.redirect("/orders");
  }
});

// Orders page
router.get("/orders", isLoggedin, async (req, res) => {
  try {
    const user = await userModel.findOne({email: req.user.email});
    const success = req.flash("success");
    const error = req.flash("error");
    
    // Populate product details for each order item
    const ordersWithProducts = await Promise.all((user.orders || []).map(async (order) => {
      const populatedItems = await Promise.all(order.items.map(async (item) => {
        if (item.product) {
          const product = await productModel.findById(item.product);
          return {
            ...item,
            product: product
          };
        }
        return item;
      }));
      
      return {
        ...order,
        items: populatedItems
      };
    }));
    
    res.render("orders", {
      user,
      orders: ordersWithProducts || [],
      success,
      error
    });
  } catch (error) {
    req.flash("error", "Failed to load orders");
    res.redirect("/shop");
  }
});

module.exports = router;
