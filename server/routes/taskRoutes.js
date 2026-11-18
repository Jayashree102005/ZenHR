
const express = require("express");
const router = express.Router();

const Task = require("../models/Task");

const employeeReadAuth = require("../middleware/employeeReadAuth");
const employeeAuth = require("../middleware/employeeAuth");

// ==========================================
// EMPLOYEE: GET MY TASKS
// ==========================================
router.get("/my", employeeAuth, async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.employee._id,
    }).sort({ dueDate: 1 });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ==========================================
// EMPLOYEE: UPDATE MY TASK STATUS
// ==========================================
router.put("/my/:id/status", employeeAuth, async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "To Do",
      "In Progress",
      "Completed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid task status",
      });
    }

    // Employee can update only their own assigned task
    const task = await Task.findOne({
      _id: req.params.id,
      assignedTo: req.employee._id,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found or access denied",
      });
    }

    task.status = status;

    await task.save();

    res.status(200).json({
      message: "Task status updated successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ==========================================
// ADMIN AND HR AUTHENTICATION
// ==========================================
router.use(employeeReadAuth);

// ==========================================
// GET - Get all tasks
// ==========================================
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("assignedTo", "firstName lastName");

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ==========================================
// POST - Create a new task
// ==========================================
router.post("/", async (req, res) => {
  try {
    const task = await Task.create(req.body);

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "firstName lastName");

    res.status(201).json({
      message: "Task created successfully",
      task: populatedTask,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// ==========================================
// PUT - Update a task
// ==========================================
router.put("/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("assignedTo", "firstName lastName");

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// ==========================================
// DELETE - Delete a task
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

module.exports = router;
