const express = require("express");
const router = express.Router();
const Activity = require("../models/Activity");
const adminAuth = require("../middleware/adminAuth");

// Protect all client routes
router.use(adminAuth);


// GET - Get all activities
router.get("/", async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate("lead")
      .populate("deal");

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST - Create activity
router.post("/", async (req, res) => {
  try {
    const activity = await Activity.create(req.body);

    const populatedActivity = await Activity.findById(activity._id)
      .populate("lead")
      .populate("deal");

    res.status(201).json(populatedActivity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT - Update activity
router.put("/:id", async (req, res) => {
  try {
    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("lead")
      .populate("deal");

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    res.json(activity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE - Delete activity
router.delete("/:id", async (req, res) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    res.json({ message: "Activity deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;