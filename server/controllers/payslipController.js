const Payslip = require("../models/Payslip");
const Employee = require("../models/Employee");
const HR = require("../models/HR");
const PDFDocument = require("pdfkit");

// ========================================
// ADMIN: CREATE PAYSLIP
// ========================================
const createPayslip = async (req, res) => {
  try {
    const {
      employeeId,
      employeeModel,
      month,
      year,
      allowances = 0,
      bonus = 0,
      deductions = 0,
      paymentDate,
    } = req.body;

    if (!employeeId || !employeeModel || !month || !year || !paymentDate) {
      return res.status(400).json({
        message: "Employee, month, year and payment date are required",
      });
    }

    if (!["Employee", "HR"].includes(employeeModel)) {
      return res.status(400).json({
        message: "Invalid employee type",
      });
    }

    const parsedMonth = Number(month);
    const parsedYear = Number(year);

    if (
      !Number.isInteger(parsedMonth) ||
      parsedMonth < 1 ||
      parsedMonth > 12 ||
      !Number.isInteger(parsedYear) ||
      parsedYear < 2000 ||
      parsedYear > 2100
    ) {
      return res.status(400).json({
        message: "Please provide a valid month and year",
      });
    }

    const parsedAllowances = Number(allowances);
    const parsedBonus = Number(bonus);
    const parsedDeductions = Number(deductions);

    if (
      !Number.isFinite(parsedAllowances) ||
      !Number.isFinite(parsedBonus) ||
      !Number.isFinite(parsedDeductions) ||
      parsedAllowances < 0 ||
      parsedBonus < 0 ||
      parsedDeductions < 0
    ) {
      return res.status(400).json({
        message: "Salary components must be valid non-negative numbers",
      });
    }

    const parsedPaymentDate = new Date(paymentDate);

    if (Number.isNaN(parsedPaymentDate.getTime())) {
      return res.status(400).json({
        message: "Please provide a valid payment date",
      });
    }

    // Find selected Employee or HR
    const PersonModel = employeeModel === "HR" ? HR : Employee;

    const person = await PersonModel.findById(employeeId).select("-password");

    if (!person) {
      return res.status(404).json({
        message: "Selected person not found",
      });
    }

    if (person.status !== "Active") {
      return res.status(400).json({
        message: "Cannot generate payslip for an inactive account",
      });
    }

    // Basic salary from saved account
    const basicSalary = Number(person.salary);

    if (!Number.isFinite(basicSalary) || basicSalary < 0) {
      return res.status(400).json({
        message: "Person has an invalid salary",
      });
    }

    // Calculate net salary on backend
    const netSalary =
      basicSalary +
      parsedAllowances +
      parsedBonus -
      parsedDeductions;

    if (netSalary < 0) {
      return res.status(400).json({
        message: "Deductions cannot exceed total earnings",
      });
    }

    // Save payslip
    const payslip = await Payslip.create({
      employee: person._id,
      employeeModel,
      employeeName: `${person.firstName} ${person.lastName}`,
      employeeEmail: person.email,
      employeeId: person._id.toString(),
      department: person.department || "General",
      designation: person.designation || employeeModel,
      month: parsedMonth,
      year: parsedYear,
      basicSalary,
      allowances: parsedAllowances,
      bonus: parsedBonus,
      deductions: parsedDeductions,
      netSalary,
      paymentDate: parsedPaymentDate,
      generatedBy: req.admin._id,
    });

    res.status(201).json({
      message: "Payslip generated successfully",
      payslip,
    });
  } catch (error) {
    console.error("Create Payslip Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Payslip already exists for this person and month",
      });
    }

    res.status(500).json({
      message: "Error generating payslip",
      error: error.message,
    });
  }
};

// ========================================
// ADMIN: ALL PAYSLIPS
// HR: EMPLOYEE PAYSLIPS ONLY
// ========================================
const getPayslips = async (req, res) => {
  try {
    let filter = {};

    if (req.userRole === "HR") {
      filter = {
        employeeModel: "Employee",
      };
    }

    const payslips = await Payslip.find(filter)
      .sort({ year: -1, month: -1, createdAt: -1 })
      .lean();

    res.status(200).json(payslips);
  } catch (error) {
    console.error("Get Payslips Error:", error);

    res.status(500).json({
      message: "Error fetching payslips",
      error: error.message,
    });
  }
};

// ========================================
// GET ONE PAYSLIP
// ADMIN: ANY PAYSLIP
// HR: EMPLOYEE PAYSLIP ONLY
// ========================================
const getPayslipById = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id).lean();

    if (!payslip) {
      return res.status(404).json({
        message: "Payslip not found",
      });
    }

    if (
      req.userRole === "HR" &&
      payslip.employeeModel !== "Employee"
    ) {
      return res.status(403).json({
        message: "HR can access Employee payslips only",
      });
    }

    res.status(200).json(payslip);
  } catch (error) {
    console.error("Get Payslip Error:", error);

    res.status(500).json({
      message: "Error fetching payslip",
      error: error.message,
    });
  }
};

// ========================================
// DOWNLOAD PAYSLIP PDF
// ADMIN: HR + EMPLOYEE
// HR: EMPLOYEE ONLY
// ========================================
const downloadPayslipPDF = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id).lean();

    if (!payslip) {
      return res.status(404).json({
        message: "Payslip not found",
      });
    }

    // HR cannot download HR payslips
    if (
      req.userRole === "HR" &&
      payslip.employeeModel !== "Employee"
    ) {
      return res.status(403).json({
        message: "HR can download Employee payslips only",
      });
    }

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const monthName = monthNames[payslip.month - 1];

    const fileName = `Payslip_${payslip.employeeName}_${monthName}_${payslip.year}.pdf`
      .replace(/\s+/g, "_");

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );

    doc.pipe(res);

    // Company Header
    doc
      .fontSize(24)
      .fillColor("#2563eb")
      .font("Helvetica-Bold")
      .text("ZenHR", { align: "center" });

    doc
      .fontSize(10)
      .fillColor("#64748b")
      .font("Helvetica")
      .text("Human Resource Management", { align: "center" });

    doc.moveDown(1.5);

    // Payslip Title
    doc
      .fontSize(18)
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .text("SALARY PAYSLIP", { align: "center" });

    doc
      .fontSize(11)
      .font("Helvetica")
      .text(`${monthName} ${payslip.year}`, {
        align: "center",
      });

    doc.moveDown(2);

    // Employee Details
    doc
      .fontSize(12)
      .fillColor("#2563eb")
      .font("Helvetica-Bold")
      .text("EMPLOYEE DETAILS");

    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .fillColor("#111827")
      .font("Helvetica");

    doc.text(`Employee Name: ${payslip.employeeName}`);
    doc.text(`Employee ID: ${payslip.employeeId}`);
    doc.text(`Email: ${payslip.employeeEmail}`);
    doc.text(`Department: ${payslip.department}`);
    doc.text(`Designation: ${payslip.designation}`);
    doc.text(
      `Payment Date: ${new Date(payslip.paymentDate).toLocaleDateString("en-IN")}`
    );

    doc.moveDown(2);

    // Salary Table Header
    const tableTop = doc.y;
    const leftX = 50;
    const rightX = 500;

    doc
      .rect(leftX, tableTop, 495, 30)
      .fill("#2563eb");

    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("SALARY COMPONENT", leftX + 12, tableTop + 10);

    doc.text("AMOUNT (INR)", rightX - 110, tableTop + 10);

    // Salary Rows
    const salaryRows = [
      ["Basic Salary", payslip.basicSalary],
      ["Allowances", payslip.allowances],
      ["Bonus", payslip.bonus],
      ["Deductions", -payslip.deductions],
    ];

    let rowY = tableTop + 30;

    salaryRows.forEach(([label, amount], index) => {
      doc
        .rect(leftX, rowY, 495, 32)
        .fill(index % 2 === 0 ? "#f8fafc" : "#ffffff");

      doc
        .fillColor("#111827")
        .font("Helvetica")
        .fontSize(10)
        .text(label, leftX + 12, rowY + 11);

      doc.text(
        `Rs. ${Number(amount).toLocaleString("en-IN")}`,
        rightX - 110,
        rowY + 11
      );

      rowY += 32;
    });

    // Net Salary
    doc
      .rect(leftX, rowY, 495, 40)
      .fill("#dbeafe");

    doc
      .fillColor("#1d4ed8")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("NET SALARY", leftX + 12, rowY + 14);

    doc.text(
      `Rs. ${Number(payslip.netSalary).toLocaleString("en-IN")}`,
      rightX - 110,
      rowY + 14
    );

    doc.moveDown(5);

    // Footer
    doc
      .fontSize(9)
      .fillColor("#64748b")
      .font("Helvetica")
      .text(
        "This is a system-generated payslip.",
        { align: "center" }
      );

    doc.text(
      "ZenHR - Confidential Salary Information",
      { align: "center" }
    );

    doc.end();
  } catch (error) {
    console.error("Download Payslip PDF Error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        message: "Error downloading payslip PDF",
      });
    }
  }
};

// ========================================
// ADMIN ONLY: DELETE PAYSLIP
// ========================================
const deletePayslip = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id);

    if (!payslip) {
      return res.status(404).json({
        message: "Payslip not found",
      });
    }

    await Payslip.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Payslip deleted successfully",
    });
  } catch (error) {
    console.error("Delete Payslip Error:", error);

    res.status(500).json({
      message: "Error deleting payslip",
      error: error.message,
    });
  }
};

module.exports = {
  createPayslip,
  getPayslips,
  getPayslipById,
  downloadPayslipPDF,
  deletePayslip,
};
