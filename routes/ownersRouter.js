const express = require('express')
const router = express.Router()
const ownerModel = require("../models/owner-model")

router.get("/login",(req,res)=>{
    let error = req.flash("error");
    let success = req.flash("success")
    res.render("owner-login",{error,success});
})

if(process.env.NODE_ENV === "development"){
    router.post("/create",async (req,res)=>{
       let owners = await ownerModel.find();
       if(owners.length>0){
        return res
        .status(504)
        .send("You dont have permission to create a new owner.");
       }
       let {fullname,email,password}= req.body;
       let createdOwner = await ownerModel.create({
        fullname,
        email,
        password
       });
       res.status(201).send(createdOwner);
    })
}
router.get("/admin", function (req, res) {
  const success = req.flash("success") || [];
  const error = req.flash("error") || [];
  res.render("admin", { success, error });
});

router.get("/createproducts", function (req, res) {
  const success = req.flash("success") || [];
  res.render("createproducts", { success });
});


module.exports = router;