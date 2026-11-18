
const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const employeeReadAuth = require("../middleware/employeeReadAuth");

const {
  createPayslip,
  getPayslips,
  getPayslipById,
  downloadPayslipPDF,
  deletePayslip,
} = require("../controllers/payslipController");

// Admin only: Generate payslip
router.post("/", adminAuth, createPayslip);

// Admin + HR: Get payslips
// HR can view Employee payslips only
router.get("/", employeeReadAuth, getPayslips);

// Admin + HR: Download payslip PDF
// HR can download Employee payslips only
router.get("/:id/pdf", employeeReadAuth, downloadPayslipPDF);

// Admin only: Delete payslip
router.delete("/:id", adminAuth, deletePayslip);

// Admin + HR: Get one payslip
// HR can access Employee payslips only
router.get("/:id", employeeReadAuth, getPayslipById);

module.exports = router;
