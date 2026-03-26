const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');
const ownerModel = require('./models/owner-model');

async function recover() {
  try {
    const dbURI = "mongodb://127.0.0.1:27017/ecommerce";
    await mongoose.connect(dbURI);
    
    const owner = await ownerModel.findOne({});
    if (!owner) {
      fs.writeFileSync('owner-credentials.txt', 'No owner account found. You can proceed with creating a new one.\n');
      process.exit(0);
    }
    
    // Resetting the password to a standard one
    const salt = await bcrypt.genSalt(10);
    const newPassword = 'admin'; 
    owner.password = await bcrypt.hash(newPassword, salt);
    await owner.save();
    
    const outputText = `Email: ${owner.email}\nNew Password: ${newPassword}\n`;
    fs.writeFileSync('owner-credentials.txt', outputText);
    
    process.exit(0);
  } catch (err) {
    fs.writeFileSync('owner-credentials.txt', `Error: ${err.message}`);
    process.exit(1);
  }
}

recover();
