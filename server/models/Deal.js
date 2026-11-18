const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema(
  {
    dealName: {
      type: String,
      required: true,
      trim: true,
    },

    companyName: {
      type: String,
      trim: true,
    },

    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
    },

    value: {
      type: Number,
      default: 0,
    },

    stage: {
      type: String,
      enum: ["Qualification", "Proposal", "Negotiation", "Won", "Lost"],
      default: "Qualification",
    },

    expectedCloseDate: {
      type: Date,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Deal", dealSchema);