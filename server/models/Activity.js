
const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["Call", "Email", "Meeting", "Task"],
      required: true,
    },

    description: {
      type: String,
    },

    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },

    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
    },

    deal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);
