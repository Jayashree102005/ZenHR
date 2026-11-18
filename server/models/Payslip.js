
const mongoose = require("mongoose");

const payslipSchema = new mongoose.Schema(
  {
    // Employee or HR account receiving the payslip
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "employeeModel",
    },

    employeeModel: {
      type: String,
      required: true,
      enum: ["Employee", "HR"],
    },

    employeeName: {
      type: String,
      required: true,
      trim: true,
    },

    employeeEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    employeeId: {
      type: String,
      required: true,
    },

    department: {
      type: String,
      default: "General",
    },

    designation: {
      type: String,
      default: "Employee",
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
    },

    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },

    allowances: {
      type: Number,
      default: 0,
      min: 0,
    },

    bonus: {
      type: Number,
      default: 0,
      min: 0,
    },

    deductions: {
      type: Number,
      default: 0,
      min: 0,
    },

    netSalary: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentDate: {
      type: Date,
      required: true,
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// One payslip per person per month
payslipSchema.index(
  { employee: 1, employeeModel: 1, month: 1, year: 1 },
  { unique: true }
);

module.exports = mongoose.model("Payslip", payslipSchema);
