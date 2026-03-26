const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Razorpay = require("razorpay");
const userModel = require("../../models/user-model");
const productModel = require("../../models/product-model");
const apiAuth = require("../../middlewares/apiAuth");


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// GET /api/orders - Get all orders for the user
router.get("/", apiAuth, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });
    const ordersWithProducts = await Promise.all((user.orders || []).map(async (order) => {
      const populatedItems = await Promise.all(order.items.map(async (item) => {
        if (item.product) {
          const product = await productModel.findById(item.product).select("-image");
          return { ...item, product };
        }
        return item;
      }));
      return { ...order, items: populatedItems };
    }));
    res.json({ orders: ordersWithProducts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/orders/checkout - Place an order
router.post("/checkout", apiAuth, async (req, res) => {
  try {
    const { fullname, email, contact, address, city, state, pincode, paymentMethod } = req.body;

    if (!fullname || !email || !contact || !address || !city || !state || !pincode || !paymentMethod) {
      return res.status(400).json({ success: false, message: "Please fill all required fields" });
    }

    const user = await userModel.findOne({ email: req.user.email }).populate("cart.product");

    if (user.cart.length === 0 || !user.cart.some(item => item.product)) {
      return res.status(400).json({ success: false, message: "Your cart is empty" });
    }

    // Validate stock
    for (let item of user.cart) {
      if (item.product) {
        const product = await productModel.findById(item.product._id);
        if (!product) {
          return res.status(400).json({ success: false, message: `Product ${item.product.name} not found` });
        }
        const productStock = product.stock ?? 0;
        if (productStock < item.quantity) {
          return res.status(400).json({ success: false, message: `Insufficient stock for ${item.product.name}. Only ${productStock} available.` });
        }
      }
    }

    // Process order
    let orderTotal = 0;
    const orderItems = [];

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
          finalPrice,
        });

        const currentStock = product.stock ?? 0;
        product.stock = Math.max(0, currentStock - item.quantity);
        await product.save();
      }
    }

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const order = {
      orderId,
      items: orderItems,
      total: orderTotal,
      shippingAddress: { fullname, email, contact, address, city, state, pincode },
      paymentMethod,
      status: 'confirmed',
      orderDate: new Date(),
      customerName: fullname,
      customerEmail: email,
    };

    user.orders.push(order);
    user.cart = [];
    await user.save();

    res.json({ success: true, orderId });
  } catch (err) {
    console.error("Order placement error:", err);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
});

// GET /api/orders/:orderId - Get specific order details
router.get("/:orderId", apiAuth, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });
    const order = user.orders.find(o => o.orderId === req.params.orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const populatedItems = await Promise.all(order.items.map(async (item) => {
      if (item.product) {
        const product = await productModel.findById(item.product).select("-image");
        return { ...item, product };
      }
      return item;
    }));

    const orderDate = order.orderDate instanceof Date ? order.orderDate : new Date(order.orderDate);
    const estimatedDeliveryDate = new Date(orderDate);
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);

    res.json({
      order: { ...order, items: populatedItems },
      estimatedDeliveryDate,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/orders/create-razorpay-order - Create a Razorpay order
router.post("/create-razorpay-order", apiAuth, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email }).populate("cart.product");

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ success: false, message: "Your cart is empty" });
    }

    // Calculate total in paise (Razorpay uses smallest currency unit)
    let orderTotal = 0;
    for (let item of user.cart) {
      if (item.product) {
        const itemPrice = item.product.discount && item.product.discount > 0
          ? item.product.price - (item.product.price * item.product.discount / 100)
          : item.product.price;
        orderTotal += Math.round(itemPrice * item.quantity);
      }
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: orderTotal * 100, // convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    res.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    res.status(500).json({ success: false, message: "Failed to create payment order" });
  }
});

// POST /api/orders/verify-payment - Verify Razorpay signature and save order
router.post("/verify-payment", apiAuth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      shippingDetails,
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed. Invalid signature." });
    }

    // Signature is valid — now save the order
    const { fullname, email, contact, address, city, state, pincode } = shippingDetails;
    const user = await userModel.findOne({ email: req.user.email }).populate("cart.product");

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    let orderTotal = 0;
    const orderItems = [];

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
          finalPrice,
        });

        const currentStock = product.stock ?? 0;
        product.stock = Math.max(0, currentStock - item.quantity);
        await product.save();
      }
    }

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const order = {
      orderId,
      items: orderItems,
      total: orderTotal,
      shippingAddress: { fullname, email, contact, address, city, state, pincode },
      paymentMethod: "online",
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      status: "confirmed",
      orderDate: new Date(),
      customerName: fullname,
      customerEmail: email,
    };

    user.orders.push(order);
    user.cart = [];
    await user.save();

    res.json({ success: true, orderId });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ success: false, message: "Failed to verify payment" });
  }
});

module.exports = router;
