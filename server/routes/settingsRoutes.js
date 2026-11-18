
const express = require("express");
const router = express.Router();

const Settings = require("../models/Settings");
const Admin = require("../models/Admin");
const adminAuth = require("../middleware/adminAuth");
const bcrypt = require("bcryptjs");

// Protect all settings routes
router.use(adminAuth);

// GET: Load settings
router.get("/", async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load settings",
      error: error.message,
    });
  }
});

// PUT: Save settings and update Admin email
router.put("/", async (req, res) => {
  try {
    const {
      adminName,
      adminEmail,
      companyName,
      companyEmail,
      emailNotifications,
      leaveNotifications,
    } = req.body;

    // Find the currently logged-in admin
    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    // Validate admin email
    if (!adminEmail) {
      return res.status(400).json({
        message: "Admin email is required",
      });
    }

    // Check whether another admin already uses this email
    const existingAdmin = await Admin.findOne({
      email: adminEmail,
      _id: { $ne: admin._id },
    });

    if (existingAdmin) {
      return res.status(400).json({
        message: "This email is already registered",
      });
    }

    // Update email in Admin collection
    admin.email = adminEmail;
    await admin.save();

    // Save settings in Settings collection
    const settings = await Settings.findOneAndUpdate(
      {},
      {
        adminName,
        adminEmail,
        companyName,
        companyEmail,
        emailNotifications,
        leaveNotifications,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      message: "Settings and admin email updated successfully",
      settings,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save settings",
      error: error.message,
    });
  }
});

// PATCH: Change Admin Password
// PATCH /api/settings/password
router.patch("/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters",
      });
    }

    // Find the logged-in admin
    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    // Verify current password
    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      admin.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in MongoDB
    admin.password = hashedPassword;
    await admin.save();

    res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to change password",
      error: error.message,
    });
  }
});

module.exports = router;
