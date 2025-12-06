const userModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const {generateToken} = require("../utils/generateToken")

module.exports.registerUser = async function(req, res) {
  try {
    let { email, fullname, password } = req.body;
    let existingUser = await userModel.findOne({ email });
    if (existingUser) {
      req.flash("error", "You already have an account, please Login");
      return res.redirect("/"); // Exit function
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    let user = await userModel.create({ email, fullname, password: hash });
    let token = generateToken(user);
    res.cookie("token", token);
    req.flash("success", "Registered Successfully");
    res.redirect("/"); // Final response per request
  } catch (err) {
    res.send(err.message); // Only one response if error
  }
};


module.exports.loginUser = async function(req, res) {
  let { email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) {
    req.flash("error", "You need to Register First");
    return res.redirect("/");
  }

  let validPassword = await bcrypt.compare(password, user.password);
  if (validPassword) {
    let token = generateToken(user);
    res.cookie("token", token);
    res.redirect("/shop");
  } else {
    req.flash("error", "Email or Password is incorrect");
    return res.redirect("/");
  }
};


module.exports.logoutUser = async function(req,res){
res.cookie("token","");
res.redirect("/");
}    