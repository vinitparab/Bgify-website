const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  fullname: {
    type: String,
    minLength: 3,
    trim: true,
  },
  email: String,
  password: String,
  // In your user model file
cart: [
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product"
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    }
  }
],
  
  orders: {
    type: Array,
    default: [],
  },
  addresses: [
    {
      fullname: String,
      contact: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
      isDefault: { type: Boolean, default: false },
    }
  ],
  contact: Number,
  picture: String,
});
module.exports = mongoose.model("user", userSchema);
