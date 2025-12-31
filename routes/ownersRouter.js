const express = require('express')
const router = express.Router()
const ownerModel = require("../models/owner-model")
const productModel = require("../models/product-model")
const bcrypt = require("bcrypt")
const {generateToken} = require("../utils/generateToken")
const isOwner = require("../middlewares/isOwner")

router.get("/login",(req,res)=>{
    let error = req.flash("error");
    let success = req.flash("success")
    res.render("owner-login",{error,success});
})

// Setup route - Create first owner (only works if no owners exist)
router.get("/setup", async (req, res) => {
  try {
    const existingOwner = await ownerModel.findOne();
    if (existingOwner) {
      req.flash("error", "An owner account already exists. Only one owner is allowed.");
      return res.redirect("/owners/login");
    }
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Setup Owner Account</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
          form { background: #f5f5f5; padding: 20px; border-radius: 8px; }
          input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
          button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; width: 100%; }
          button:hover { background: #0056b3; }
          .warning { background: #fff3cd; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
          .error { background: #f8d7da; padding: 10px; border-radius: 4px; margin-bottom: 20px; color: #721c24; }
        </style>
      </head>
      <body>
        <h2>Setup Owner Account</h2>
        <div class="warning">
          <strong>⚠️ First Owner Setup</strong><br>
          This will create the first and ONLY owner account. Make sure to remember your credentials!
        </div>
        <form action="/owners/create" method="POST">
          <input type="text" name="fullname" placeholder="Full Name" required>
          <input type="email" name="email" placeholder="Email" required>
          <input type="password" name="password" placeholder="Password" required>
          <button type="submit">Create Owner Account</button>
        </form>
        <p style="text-align: center; margin-top: 20px;">
          <a href="/owners/login">Already have an account? Login here</a>
        </p>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send("Error: " + error.message);
  }
});

// Owner login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      req.flash("error", "Email and password are required");
      return res.redirect("/owners/login");
    }
    
    const owner = await ownerModel.findOne({ email });
    
    if (!owner) {
      req.flash("error", "Invalid email or password");
      return res.redirect("/owners/login");
    }
    
    // Check if password matches (assuming password is hashed)
    // If password is not hashed in DB, you might need to hash it first
    let validPassword = false;
    
    // Try to compare with hashed password
    if (owner.password && owner.password.length > 20) {
      // Likely hashed password
      validPassword = await bcrypt.compare(password, owner.password);
    } else {
      // Plain text password (for existing owners) - migrate to hashed
      if (owner.password === password) {
        validPassword = true;
        // Hash the password for future use
        const salt = await bcrypt.genSalt(10);
        owner.password = await bcrypt.hash(password, salt);
        await owner.save();
      }
    }
    
    if (validPassword) {
      const token = generateToken(owner);
      res.cookie("ownerToken", token);
      req.flash("success", "Logged in successfully");
      res.redirect("/owners/admin");
    } else {
      req.flash("error", "Invalid email or password");
      res.redirect("/owners/login");
    }
  } catch (err) {
    req.flash("error", "Login failed. Please try again.");
    res.redirect("/owners/login");
  }
});

// Owner logout route
router.post("/logout", (req, res) => {
  res.cookie("ownerToken", "");
  req.flash("success", "Logged out successfully");
  res.redirect("/owners/login");
});

// Create owner route - ONLY allows creating if NO owners exist (one owner only)
router.post("/create",async (req,res)=>{
   try {
     // Check if any owner already exists
     const existingOwner = await ownerModel.findOne();
     
     // STRICT: Only one owner allowed - no exceptions
     if(existingOwner) {
       req.flash("error", "An owner account already exists. Only one owner is allowed in the system.");
       return res.redirect("/owners/login");
     }
     
     let {fullname, email, password} = req.body;
     
     if (!fullname || !email || !password) {
       req.flash("error", "All fields are required");
       return res.redirect("/owners/setup");
     }
     
     // Check if owner with this email already exists (double check)
     const ownerWithEmail = await ownerModel.findOne({ email });
     if (ownerWithEmail) {
       req.flash("error", "An owner with this email already exists");
       return res.redirect("/owners/login");
     }
     
     // Hash the password before saving
     const salt = await bcrypt.genSalt(10);
     const hashedPassword = await bcrypt.hash(password, salt);
     
     // Create the owner
     let createdOwner = await ownerModel.create({
      fullname,
      email,
      password: hashedPassword,
      isadmin: true
     });
     
     req.flash("success", "Owner account created successfully! Please login.");
     res.redirect("/owners/login");
   } catch (err) {
     req.flash("error", "Error creating owner: " + err.message);
     res.redirect("/owners/setup");
   }
})
router.get("/admin", isOwner, async function (req, res) {
  const success = req.flash("success") || [];
  const error = req.flash("error") || [];
  const products = await productModel.find();
  
  // Get notifications for the logged-in owner
  const owner = req.owner;
  const notifications = owner && owner.notifications ? owner.notifications.filter(n => !n.read) : [];
  const unreadCount = notifications.length;
  
  res.render("admin", { success, error, products, notifications, unreadCount });
});

router.get("/createproducts", isOwner, function (req, res) {
  const success = req.flash("success") || [];
  res.render("createproducts", { success });
});

// Mark notifications as read
router.post("/admin/mark-read", isOwner, async function (req, res) {
  try {
    const owner = req.owner;
    if (owner && owner.notifications) {
      owner.notifications.forEach(notification => {
        notification.read = true;
      });
      await owner.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


module.exports = router;