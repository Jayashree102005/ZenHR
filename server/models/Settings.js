
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Settings", settingsSchema);
