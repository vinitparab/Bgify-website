require("dotenv").config();

const express = require("express");
const app = express();

const cookieParser = require("cookie-parser");
const path = require("path");

// API Routes (for React frontend)
const apiAuthRoutes = require("./routes/api/authRoutes");
const apiProductRoutes = require("./routes/api/productRoutes");
const apiImageRoutes = require("./routes/api/imageRoutes");
const apiCartRoutes = require("./routes/api/cartRoutes");
const apiOrderRoutes = require("./routes/api/orderRoutes");
const apiOwnerRoutes = require("./routes/api/ownerRoutes");


const database = require("./config/mongoose-connection");

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));


app.use("/api/auth", apiAuthRoutes);
app.use("/api/products", apiProductRoutes);
app.use("/api/images", apiImageRoutes);
app.use("/api/cart", apiCartRoutes);
app.use("/api/orders", apiOrderRoutes);
app.use("/api/owner", apiOwnerRoutes);

// Serve React frontend in production
app.use(express.static(path.join(__dirname, "client/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));