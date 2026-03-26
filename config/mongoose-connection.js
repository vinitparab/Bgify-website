const mongoose = require("mongoose");
const dbgr = require("debug")("development:mongoose");

// Use env var directly (for production/Render) or fall back to config (for local dev)
let mongoURI;
if (process.env.MONGODB_URI) {
  mongoURI = process.env.MONGODB_URI;
} else {
  const config = require("config");
  mongoURI = `${config.get("MONGODB_URI")}/ecommerce`;
}

mongoose
.connect(mongoURI)
.then(function(){
    dbgr("connected to database");
    console.log("MongoDB connected successfully");
})
.catch(function(err){
    dbgr("error connecting to database");
    console.error("MongoDB connection error:", err.message);
});
module.exports = mongoose.connection;