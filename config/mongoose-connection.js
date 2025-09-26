const mongoose = require("mongoose");

mongoose
.connect("mongodb://127.0.0.1:27017/ecommerce")
.then(function(){
    console.log("connected to database");
    
})
.catch(function(){
    console.log("error connecting to database");
});
module.exports = mongoose.connection;