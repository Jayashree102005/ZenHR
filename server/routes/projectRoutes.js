
const express = require("express");
const Project = require("../models/Project");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// Protect all project routes
router.use(adminAuth);

// GET - Fetch all projects
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("teamMembers", "firstName lastName department designation")
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch projects",
      error: error.message,
    });
  }
});

// POST - Create a project
router.post("/", async (req, res) => {
  try {
    const project = await Project.create(req.body);

    const populatedProject = await Project.findById(project._id)
      .populate("teamMembers", "firstName lastName department designation");

    res.status(201).json({
      message: "Project created successfully",
      project: populatedProject,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to create project",
      error: error.message,
    });
  }
});

// PUT - Update a project
router.put("/:id", async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("teamMembers", "firstName lastName department designation");

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    res.status(200).json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update project",
      error: error.message,
    });
  }
});

// DELETE - Delete a project
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to delete project",
      error: error.message,
    });
  }
});

module.exports = router;
