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

// PUT: Save account, company and office settings
router.put("/", async (req, res) => {
  try {
    const {
      adminName,
      adminEmail,
      companyName,
      companyEmail,
      emailNotifications,
      leaveNotifications,
      officeStartTime,
      officeEndTime,
      gracePeriodMinutes,
      workingDays,
    } = req.body;

    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    // Validate admin email when provided
    if (adminEmail !== undefined) {
      if (!adminEmail.trim()) {
        return res.status(400).json({
          message: "Admin email is required",
        });
      }

      const existingAdmin = await Admin.findOne({
        email: adminEmail,
        _id: { $ne: admin._id },
      });

      if (existingAdmin) {
        return res.status(400).json({
          message: "This email is already registered",
        });
      }

      admin.email = adminEmail;
      await admin.save();
    }

    // Prepare only the fields sent by frontend
    const updateFields = {};

    if (adminName !== undefined) updateFields.adminName = adminName;
    if (adminEmail !== undefined) updateFields.adminEmail = adminEmail;
    if (companyName !== undefined) updateFields.companyName = companyName;
    if (companyEmail !== undefined) updateFields.companyEmail = companyEmail;

    if (emailNotifications !== undefined) {
      updateFields.emailNotifications = emailNotifications;
    }

    if (leaveNotifications !== undefined) {
      updateFields.leaveNotifications = leaveNotifications;
    }

    if (officeStartTime !== undefined) {
      updateFields.officeStartTime = officeStartTime;
    }

    if (officeEndTime !== undefined) {
      updateFields.officeEndTime = officeEndTime;
    }

    if (gracePeriodMinutes !== undefined) {
      updateFields.gracePeriodMinutes = gracePeriodMinutes;
    }

    if (workingDays !== undefined) {
      updateFields.workingDays = workingDays;
    }

    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: updateFields },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    // Validate that end time is after start time
    if (settings.officeEndTime <= settings.officeStartTime) {
      return res.status(400).json({
        message: "Office end time must be later than office start time",
      });
    }

    res.status(200).json({
      message: "Settings updated successfully",
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

    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      admin.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

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