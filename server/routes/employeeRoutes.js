
const express = require("express");
const router = express.Router();

// Middleware
const adminAuth = require("../middleware/adminAuth");
const employeeReadAuth = require("../middleware/employeeReadAuth");
const employeeAuth = require("../middleware/employeeAuth");

// Model
const Employee = require("../models/Employee");

// Controller functions
const {
  getEmployees,
  createEmployee,
  loginEmployee,
  changeEmployeePassword,
  updateEmployee,
  deleteEmployee,
  permanentlyDeleteEmployee,
} = require("../controllers/employeeController");

// EMPLOYEE LOGIN
router.post("/login", loginEmployee);

// EMPLOYEE CHANGE PASSWORD
router.put("/change-password", employeeAuth, changeEmployeePassword);

// EMPLOYEE MY PROFILE
router.get("/my", employeeAuth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee._id)
      .select(
        "firstName lastName email phone department designation role joiningDate status createdAt"
      );

    if (!employee) {
      return res.status(404).json({
        message: "Employee profile not found.",
      });
    }

    return res.status(200).json({
      message: "Employee profile fetched successfully.",
      employee,
    });
  } catch (error) {
    console.error("Employee profile error:", error);

    return res.status(500).json({
      message: "Failed to fetch employee profile.",
    });
  }
});

// GET ALL EMPLOYEES - Admin and HR
router.get("/", employeeReadAuth, getEmployees);

// CREATE EMPLOYEE - Admin and HR
router.post("/", employeeReadAuth, createEmployee);

// UPDATE EMPLOYEE - Admin only
router.put("/:id", adminAuth, updateEmployee);

// DEACTIVATE EMPLOYEE - Admin only
router.delete("/:id", adminAuth, deleteEmployee);

// PERMANENTLY DELETE EMPLOYEE - Admin only
router.delete("/:id/permanent", adminAuth, permanentlyDeleteEmployee);

module.exports = router;
