const express = require("express");
const router = express.Router();
const userModel = require("../../models/user-model");
const apiAuth = require("../../middlewares/apiAuth");

// GET /api/addresses - Get all saved addresses
router.get("/", apiAuth, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });
    res.json({ success: true, addresses: user.addresses || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/addresses - Add a new address
router.post("/", apiAuth, async (req, res) => {
  try {
    const { fullname, contact, address, city, state, pincode } = req.body;

    if (!fullname || !contact || !address || !city || !state || !pincode) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const user = await userModel.findOne({ email: req.user.email });

    // Check for duplicate address
    const isDuplicate = user.addresses.some(
      (a) =>
        a.fullname === fullname &&
        a.contact === contact &&
        a.address === address &&
        a.city === city &&
        a.state === state &&
        a.pincode === pincode
    );

    if (isDuplicate) {
      return res.status(400).json({ success: false, message: "This address already exists" });
    }

    // If this is the first address, make it default
    const isDefault = user.addresses.length === 0;

    user.addresses.push({ fullname, contact, address, city, state, pincode, isDefault });
    await user.save();

    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/addresses/:id - Update an address
router.put("/:id", apiAuth, async (req, res) => {
  try {
    const { fullname, contact, address, city, state, pincode } = req.body;
    const user = await userModel.findOne({ email: req.user.email });
    const addr = user.addresses.id(req.params.id);

    if (!addr) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    if (fullname) addr.fullname = fullname;
    if (contact) addr.contact = contact;
    if (address) addr.address = address;
    if (city) addr.city = city;
    if (state) addr.state = state;
    if (pincode) addr.pincode = pincode;

    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/addresses/:id - Delete an address
router.delete("/:id", apiAuth, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });
    const addr = user.addresses.id(req.params.id);

    if (!addr) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    const wasDefault = addr.isDefault;
    user.addresses.pull(req.params.id);

    // If the deleted address was default and there are still addresses, make the first one default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/addresses/:id/default - Set an address as default
router.put("/:id/default", apiAuth, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });

    // Remove default from all addresses
    user.addresses.forEach((a) => (a.isDefault = false));

    const addr = user.addresses.id(req.params.id);
    if (!addr) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    addr.isDefault = true;
    await user.save();

    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
