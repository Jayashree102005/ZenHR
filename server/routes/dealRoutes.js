const express = require("express");
const router = express.Router();
const Deal = require("../models/Deal");
const adminAuth = require("../middleware/adminAuth");

// Protect all client routes
router.use(adminAuth);

// GET all deals
router.get("/", async (req, res) => {
  try {
    const deals = await Deal.find()
      .populate("lead", "leadName companyName")
      .populate("assignedTo", "firstName lastName");

    res.status(200).json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single deal
router.get("/:id", async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate("lead", "leadName companyName")
      .populate("assignedTo", "firstName lastName");

    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    res.status(200).json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE deal
router.post("/", async (req, res) => {
  try {
    const newDeal = new Deal(req.body);
    const savedDeal = await newDeal.save();

    res.status(201).json(savedDeal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE deal
router.put("/:id", async (req, res) => {
  try {
    const updatedDeal = await Deal.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("lead", "leadName companyName")
      .populate("assignedTo", "firstName lastName");

    if (!updatedDeal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    res.status(200).json(updatedDeal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE deal
router.delete("/:id", async (req, res) => {
  try {
    const deletedDeal = await Deal.findByIdAndDelete(req.params.id);

    if (!deletedDeal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    res.status(200).json({ message: "Deal deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;