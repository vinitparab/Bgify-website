# Owner Login Setup Guide

## Method 1: Create Owner via Development Route (Easiest)

1. **Set your environment to development mode:**
   - Make sure `NODE_ENV=development` in your `.env` file, OR
   - Don't set NODE_ENV (defaults to development)

2. **Start your server:**
   ```bash
   npm start
   ```

3. **Create the first owner account:**
   - Go to: `http://localhost:3000/owners/login`
   - Use the form below to create an owner, OR
   - Send a POST request to `/owners/create` with:
     ```json
     {
       "fullname": "Admin Name",
       "email": "admin@example.com",
       "password": "yourpassword"
     }
     ```

4. **Login as owner:**
   - Go to: `http://localhost:3000/owners/login`
   - Enter the email and password you just created
   - You'll be redirected to the admin panel

## Method 2: Create Owner via MongoDB (Direct Database)

1. **Open MongoDB Compass or MongoDB Shell**

2. **Connect to your database**

3. **Insert owner document:**
   ```javascript
   // First, hash the password using Node.js bcrypt
   // Or use this in MongoDB shell (you'll need to hash it first):
   
   db.owners.insertOne({
     fullname: "Admin Name",
     email: "admin@example.com",
     password: "hashed_password_here", // Use bcrypt to hash first
     isadmin: true,
     products: [],
     orders: [],
     notifications: []
   })
   ```

4. **To hash password, use Node.js:**
   ```javascript
   const bcrypt = require('bcrypt');
   const salt = await bcrypt.genSalt(10);
   const hashedPassword = await bcrypt.hash('yourpassword', salt);
   console.log(hashedPassword); // Use this in MongoDB
   ```

## Method 3: Create Owner via API/Postman

1. **Make sure NODE_ENV=development**

2. **Send POST request to:** `http://localhost:3000/owners/create`
   - Headers: `Content-Type: application/json`
   - Body:
     ```json
     {
       "fullname": "Admin Name",
       "email": "admin@example.com",
       "password": "yourpassword"
     }
     ```

## Important Notes:

- ⚠️ **The `/owners/create` route only works when:**
  - `NODE_ENV === "development"` AND
  - No owners exist in the database yet (first owner only)

- 🔒 **After creating the first owner, you cannot create more via this route**

- ✅ **Password is automatically hashed** when created via the route

- 🔑 **Login URL:** `http://localhost:3000/owners/login`

- 🚪 **Admin Panel URL:** `http://localhost:3000/owners/admin` (requires login)

## Quick Setup Script

You can also create a setup script. Create a file `setup-owner.js`:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const ownerModel = require('./models/owner-model');
require('dotenv').config();

async function setupOwner() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database');
    
    const existingOwner = await ownerModel.findOne();
    if (existingOwner) {
      console.log('Owner already exists!');
      process.exit(0);
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const owner = await ownerModel.create({
      fullname: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      isadmin: true
    });
    
    console.log('Owner created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setupOwner();
```

Then run: `node setup-owner.js`

