
const mongoose = require("mongoose");

const hrSchema = new mongoose.Schema(
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
      required: true,
      select: false,
    },

    // Force HR to change password on first login
    mustChangePassword: {
      type: Boolean,
      default: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    department: {
      type: String,
      trim: true,
      default: "HR",
    },

    designation: {
      type: String,
      trim: true,
      default: "HR Manager",
    },

    // HR Joining Date
    joiningDate: {
      type: Date,
      required: true,
    },

    // HR Monthly Salary
    salary: {
      type: Number,
      required: true,
      min: 0,
    },

    role: {
      type: String,
      default: "HR",
      enum: ["HR"],
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("HR", hrSchema);
