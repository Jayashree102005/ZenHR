
const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "applicantModel",
      required: true,
    },

    applicantModel: {
      type: String,
      enum: ["Employee", "HR"],
      required: true,
    },

    leaveType: {
      type: String,
      enum: ["Casual Leave", "Sick Leave", "Annual Leave", "Other"],
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Leave", leaveSchema);
