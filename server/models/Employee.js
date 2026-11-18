
const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      select: false,
    },

    mustChangePassword: {
      type: Boolean,
      default: true,
    },

    phone: {
      type: String,
    },

    department: {
      type: String,
      required: true,
      default: "General",
    },

    designation: {
      type: String,
      required: true,
      default: "Employee",
    },

    role: {
      type: String,
      enum: ["Admin", "HR", "Employee"],
      default: "Employee",
    },

    joiningDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    salary: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Employee", employeeSchema);
