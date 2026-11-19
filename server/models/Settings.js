const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    adminName: {
      type: String,
      default: "Admin",
    },

    adminEmail: {
      type: String,
      default: "admin@zenhr.com",
    },

    companyName: {
      type: String,
      default: "ZenHR",
    },

    companyEmail: {
      type: String,
      default: "contact@zenhr.com",
    },

    emailNotifications: {
      type: Boolean,
      default: true,
    },

    leaveNotifications: {
      type: Boolean,
      default: true,
    },

    // Office Timing Settings
    officeStartTime: {
      type: String,
      default: "09:00",
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    officeEndTime: {
      type: String,
      default: "18:00",
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    gracePeriodMinutes: {
      type: Number,
      default: 15,
      min: 0,
      max: 180,
    },

    workingDays: {
      type: [String],
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      default: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
      ],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Settings", settingsSchema);