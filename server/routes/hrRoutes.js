
const sendEmail = require("../utils/sendEmail");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const HR = require("../models/HR");
const adminAuth = require("../middleware/adminAuth");
const hrAuth = require("../middleware/hrAuth");

const router = express.Router();

// ========================================
// GET: Fetch all HR accounts
// ========================================
router.get("/", adminAuth, async (req, res) => {
  try {
    const hrs = await HR.find().select("-password");

    res.status(200).json(hrs);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch HR accounts",
      error: error.message,
    });
  }
});

// ========================================
// POST: Create HR account
// ========================================
router.post("/create", adminAuth, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      department,
      designation,
      joiningDate,
      salary,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !joiningDate ||
      salary === undefined ||
      salary === null ||
      salary === ""
    ) {
      return res.status(400).json({
        message:
          "First name, last name, email, password, joining date, and salary are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const parsedJoiningDate = new Date(joiningDate);

    if (Number.isNaN(parsedJoiningDate.getTime())) {
      return res.status(400).json({
        message: "Invalid joining date",
      });
    }

    const parsedSalary = Number(salary);

    if (!Number.isFinite(parsedSalary) || parsedSalary < 0) {
      return res.status(400).json({
        message: "Salary must be a valid non-negative number",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingHR = await HR.findOne({
      email: normalizedEmail,
    });

    if (existingHR) {
      return res.status(409).json({
        message: "HR account already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newHR = await HR.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
      mustChangePassword: true,
      phone: phone || "",
      department: department || "HR",
      designation: designation || "HR Manager",
      joiningDate: parsedJoiningDate,
      salary: parsedSalary,
      role: "HR",
      status: "Active",
      createdBy: req.admin._id,
    });

    await sendEmail({
      to: newHR.email,
      subject: "Welcome to ZenHR - Your HR Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #4f46e5;">Welcome to ZenHR!</h2>

          <p>Hello ${newHR.firstName},</p>

          <p>Your HR account has been created successfully.</p>

          <p>Here are your login details:</p>

          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px;">
            <p><strong>Email:</strong> ${newHR.email}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p><strong>Role:</strong> HR</p>
          </div>

          <p>Please log in and change your temporary password immediately.</p>

          <p>Regards,<br/>ZenHR Admin Team</p>
        </div>
      `,
    });

    res.status(201).json({
      message: "HR account created and email sent successfully",
      hr: {
        _id: newHR._id,
        firstName: newHR.firstName,
        lastName: newHR.lastName,
        email: newHR.email,
        phone: newHR.phone,
        department: newHR.department,
        designation: newHR.designation,
        joiningDate: newHR.joiningDate,
        salary: newHR.salary,
        role: newHR.role,
        status: newHR.status,
        mustChangePassword: newHR.mustChangePassword,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create HR account or send email",
      error: error.message,
    });
  }
});

// ========================================
// POST: HR Login
// ========================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const hr = await HR.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!hr) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (hr.status !== "Active") {
      return res.status(403).json({
        message: "Your HR account is inactive",
      });
    }

    const isPasswordMatch = await bcrypt.compare(
      password,
      hr.password
    );

    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Server authentication configuration error",
      });
    }

    const token = jwt.sign(
      {
        id: hr._id,
        role: "HR",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "HR login successful",
      token,
      mustChangePassword: hr.mustChangePassword !== false,
      hr: {
        _id: hr._id,
        firstName: hr.firstName,
        lastName: hr.lastName,
        email: hr.email,
        phone: hr.phone,
        department: hr.department,
        designation: hr.designation,
        joiningDate: hr.joiningDate,
        salary: hr.salary,
        role: hr.role,
        status: hr.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "HR login failed",
      error: error.message,
    });
  }
});

// ========================================
// PUT: HR Change Password
// ========================================
router.put("/change-password", hrAuth, async (req, res) => {
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

    const hr = await HR.findById(req.hr._id).select("+password");

    if (!hr) {
      return res.status(404).json({
        message: "HR account not found",
      });
    }

    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      hr.password
    );

    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      hr.password
    );

    if (isSamePassword) {
      return res.status(400).json({
        message: "New password must be different from current password",
      });
    }

    hr.password = await bcrypt.hash(newPassword, 10);
    hr.mustChangePassword = false;

    await hr.save();

    res.status(200).json({
      message: "Password changed successfully",
      mustChangePassword: false,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to change password",
      error: error.message,
    });
  }
});

// ========================================
// GET: HR Profile
// ========================================
router.get("/profile", hrAuth, async (req, res) => {
  try {
    const hr = await HR.findById(req.hr._id).select("-password");

    if (!hr) {
      return res.status(404).json({
        message: "HR account not found",
      });
    }

    res.status(200).json({
      hr,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch HR profile",
      error: error.message,
    });
  }
});

// ========================================
// PUT: Update HR details
// ========================================
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const {
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      joiningDate,
      salary,
      status,
    } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid HR ID",
      });
    }

    if (
      !firstName ||
      !lastName ||
      !email ||
      !joiningDate ||
      salary === undefined ||
      salary === null ||
      salary === ""
    ) {
      return res.status(400).json({
        message:
          "First name, last name, email, joining date, and salary are required",
      });
    }

    const parsedJoiningDate = new Date(joiningDate);

    if (Number.isNaN(parsedJoiningDate.getTime())) {
      return res.status(400).json({
        message: "Invalid joining date",
      });
    }

    const parsedSalary = Number(salary);

    if (!Number.isFinite(parsedSalary) || parsedSalary < 0) {
      return res.status(400).json({
        message: "Salary must be a valid non-negative number",
      });
    }

    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Active or Inactive",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingHR = await HR.findOne({
      email: normalizedEmail,
      _id: { $ne: id },
    });

    if (existingHR) {
      return res.status(409).json({
        message: "Email is already used by another HR",
      });
    }

    const updatedHR = await HR.findByIdAndUpdate(
      id,
      {
        firstName,
        lastName,
        email: normalizedEmail,
        phone: phone || "",
        department: department || "HR",
        designation: designation || "HR Manager",
        joiningDate: parsedJoiningDate,
        salary: parsedSalary,
        status,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!updatedHR) {
      return res.status(404).json({
        message: "HR account not found",
      });
    }

    res.status(200).json({
      message: "HR details updated successfully",
      hr: updatedHR,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update HR details",
      error: error.message,
    });
  }
});

// ========================================
// PATCH: Update HR status
// ========================================
router.patch("/:id/status", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid HR ID",
      });
    }

    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Active or Inactive",
      });
    }

    const updatedHR = await HR.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!updatedHR) {
      return res.status(404).json({
        message: "HR account not found",
      });
    }

    res.status(200).json({
      message: "HR status updated successfully",
      hr: updatedHR,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update HR status",
      error: error.message,
    });
  }
});

// ========================================
// DELETE: HR account
// ========================================
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid HR ID",
      });
    }

    const deletedHR = await HR.findByIdAndDelete(id);

    if (!deletedHR) {
      return res.status(404).json({
        message: "HR account not found",
      });
    }

    res.status(200).json({
      message: "HR account deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete HR account",
      error: error.message,
    });
  }
});

module.exports = router;
