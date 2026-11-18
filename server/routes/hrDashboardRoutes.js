const express = require("express");
const router = express.Router();

const hrAuth = require("../middleware/hrAuth");

const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Task = require("../models/Task");

// HR Dashboard API
router.get("/", hrAuth, async (req, res) => {
  try {
    // Today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total employees (excluding HR/Admin roles)
    const totalEmployees = await Employee.countDocuments({
      role: { $nin: ["HR", "Admin"] },
    });

    // Present today: Employees + HR
    // Include both Present and Late statuses
    const presentToday = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ["Present", "Late"] },
    });

    // Pending leave requests
    const pendingLeaves = await Leave.countDocuments({
      status: "Pending",
    });

    // Open tasks (not completed)
    const openTasks = await Task.countDocuments({
      status: { $ne: "Completed" },
    });

    // Employees whose approved leave overlaps today
    const todayLeaves = await Leave.find({
      status: "Approved",
      startDate: { $lt: tomorrow },
      endDate: { $gte: today },
    })
      .populate("employee", "firstName lastName")
      .sort({ startDate: 1 });

    // High priority tasks that are not completed
    const highPriorityTasks = await Task.find({
      priority: "High",
      status: { $ne: "Completed" },
    })
      .populate("assignedTo", "firstName lastName")
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        presentToday,
        pendingLeaves,
        openTasks,
        todayLeaves,
        highPriorityTasks,
      },
    });
  } catch (error) {
    console.error("HR Dashboard Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load HR dashboard data.",
    });
  }
});

module.exports = router;
