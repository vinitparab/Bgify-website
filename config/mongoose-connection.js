const mongoose = require("mongoose");
const dbgr = require("debug")("development:mongoose");
const config = require("config")

mongoose
.connect(`${config.get("MONGODB_URI")}/ecommerce`)
.then(function(){
    dbgr("connected to database");
    
})
.catch(function(){
    dbgr("error connecting to database");
});
module.exports = mongoose.connection;