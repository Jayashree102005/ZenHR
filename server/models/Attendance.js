const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    hr: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HR",
      default: null,
    },

    date: {
      type: Date,
      required: true,
    },

    checkIn: {
      type: Date,
      default: null,
    },

    checkOut: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Half Day", "On Leave"],
      default: "Present",
    },
  },
  { timestamps: true }
);

// Each attendance record must belong to either an Employee or an HR
attendanceSchema.pre("validate", function () {
  if (!this.employee && !this.hr) {
    throw new Error(
      "Attendance must belong to an Employee or HR"
    );
  }

  if (this.employee && this.hr) {
    throw new Error(
      "Attendance cannot belong to both Employee and HR"
    );
  }
});

module.exports = mongoose.model("Attendance", attendanceSchema);
