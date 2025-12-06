const jwt = require("jsonwebtoken");
const { JWT_KEY } = require("../config/keys");

const generateToken = (user) => {
  const secret = JWT_KEY || "development-jwt-secret";
  return jwt.sign({ email: user.email, id: user._id }, secret);
};

module.exports.generateToken = generateToken;