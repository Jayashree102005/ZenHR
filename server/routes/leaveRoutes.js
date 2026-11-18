
const express = require("express");
const router = express.Router();

const Leave = require("../models/Leave");
const Attendance = require("../models/Attendance");

const employeeReadAuth = require("../middleware/employeeReadAuth");
const employeeAuth = require("../middleware/employeeAuth");

// ==========================================
// EMPLOYEE - APPLY FOR LEAVE
// ==========================================
router.post("/employee/my", employeeAuth, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    const allowedLeaveTypes = [
      "Casual Leave",
      "Sick Leave",
      "Annual Leave",
      "Other",
    ];

    if (!leaveType || !startDate || !endDate || !reason?.trim()) {
      return res.status(400).json({
        message: "All leave fields are required",
      });
    }

    if (!allowedLeaveTypes.includes(leaveType)) {
      return res.status(400).json({
        message: "Invalid leave type",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message: "Invalid leave dates",
      });
    }

    if (end < start) {
      return res.status(400).json({
        message: "End date cannot be before start date",
      });
    }

    const leave = await Leave.create({
      employee: req.employee._id,
      applicantModel: "Employee",
      leaveType,
      startDate: start,
      endDate: end,
      reason: reason.trim(),
    });

    res.status(201).json({
      message: "Leave applied successfully. Waiting for approval.",
      leave,
    });
  } catch (error) {
    console.error("Employee leave application error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});


// ==========================================
// EMPLOYEE - GET OWN LEAVE HISTORY
// ==========================================
router.get("/employee/my", employeeAuth, async (req, res) => {
  try {
    const leaves = await Leave.find({
      employee: req.employee._id,
      applicantModel: "Employee",
    }).sort({ appliedAt: -1 });

    res.status(200).json(leaves);
  } catch (error) {
    console.error("Employee leave history error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});


// ==========================================
// ADMIN / HR AUTHENTICATION
// ==========================================
router.use(employeeReadAuth);


// ==========================================
// APPLY FOR LEAVE - HR
// ==========================================
router.post("/", async (req, res) => {
  try {
    if (req.userRole !== "HR") {
      return res.status(403).json({
        message: "Only HR can apply for leave using this route",
      });
    }

    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        message: "All leave fields are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message: "Invalid leave dates",
      });
    }

    if (end < start) {
      return res.status(400).json({
        message: "End date cannot be before start date",
      });
    }

    const leave = await Leave.create({
      employee: req.hr._id,
      applicantModel: "HR",
      leaveType,
      startDate: start,
      endDate: end,
      reason,
    });

    const populatedLeave = await Leave.findById(leave._id).populate(
      "employee",
      "firstName lastName email"
    );

    res.status(201).json({
      message: "Leave applied successfully. Waiting for Admin approval.",
      leave: populatedLeave,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


// ==========================================
// GET LEAVE REQUESTS
// ADMIN - HR + EMPLOYEE REQUESTS
// HR - EMPLOYEE REQUESTS ONLY
// ==========================================
router.get("/", async (req, res) => {
  try {
    let filter = {};

    if (req.userRole === "Admin") {
      filter = {};
    } else if (req.userRole === "HR") {
      filter = {
        applicantModel: "Employee",
      };
    } else {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    const leaves = await Leave.find(filter)
      .populate("employee", "firstName lastName email")
      .sort({ appliedAt: -1 });

    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


// ==========================================
// HR - GET OWN LEAVE HISTORY
// ==========================================
router.get("/my", async (req, res) => {
  try {
    if (req.userRole !== "HR") {
      return res.status(403).json({
        message: "Only HR can access this route",
      });
    }

    const leaves = await Leave.find({
      employee: req.hr._id,
      applicantModel: "HR",
    })
      .populate("employee", "firstName lastName email")
      .sort({ appliedAt: -1 });

    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


// ==========================================
// APPROVE / REJECT LEAVE
// ADMIN - HR + EMPLOYEE REQUESTS
// HR - EMPLOYEE REQUESTS ONLY
// ==========================================
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Approved or Rejected",
      });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        message: "Leave request not found",
      });
    }

    // ADMIN CAN APPROVE ALL REQUESTS
    if (req.userRole === "Admin") {
      // Allowed
    }

    // HR CAN APPROVE EMPLOYEE REQUESTS ONLY
    else if (req.userRole === "HR") {
      if (leave.applicantModel !== "Employee") {
        return res.status(403).json({
          message:
            "HR cannot approve or reject HR leave requests. Only Admin can do this.",
        });
      }
    } else {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    if (leave.status === status) {
      return res.status(400).json({
        message: `Leave is already ${status}`,
      });
    }

    const ownerFilter =
      leave.applicantModel === "HR"
        ? { hr: leave.employee }
        : { employee: leave.employee };

    // REMOVE OLD ON LEAVE ATTENDANCE IF PREVIOUSLY APPROVED
    if (leave.status === "Approved") {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      const startDate = new Date(
        Date.UTC(
          start.getUTCFullYear(),
          start.getUTCMonth(),
          start.getUTCDate()
        )
      );

      const endDateExclusive = new Date(
        Date.UTC(
          end.getUTCFullYear(),
          end.getUTCMonth(),
          end.getUTCDate() + 1
        )
      );

      await Attendance.deleteMany({
        ...ownerFilter,
        status: "On Leave",
        date: {
          $gte: startDate,
          $lt: endDateExclusive,
        },
      });
    }

    leave.status = status;
    await leave.save();

    // CREATE ON LEAVE ATTENDANCE RECORDS
    if (status === "Approved") {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      let currentDate = new Date(
        Date.UTC(
          start.getUTCFullYear(),
          start.getUTCMonth(),
          start.getUTCDate()
        )
      );

      const finalDate = new Date(
        Date.UTC(
          end.getUTCFullYear(),
          end.getUTCMonth(),
          end.getUTCDate()
        )
      );

      while (currentDate <= finalDate) {
        const nextDate = new Date(currentDate);
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);

        await Attendance.findOneAndUpdate(
          {
            ...ownerFilter,
            date: {
              $gte: currentDate,
              $lt: nextDate,
            },
          },
          {
            $set: {
              ...ownerFilter,
              date: currentDate,
              status: "On Leave",
              checkIn: null,
              checkOut: null,
            },
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
            setDefaultsOnInsert: true,
          }
        );

        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
    }

    const updatedLeave = await Leave.findById(leave._id).populate(
      "employee",
      "firstName lastName email"
    );

    res.status(200).json({
      message: `Leave ${status.toLowerCase()} successfully`,
      leave: updatedLeave,
    });
  } catch (error) {
    console.error("Leave approval error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});


// ==========================================
// DELETE LEAVE - ADMIN ONLY
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    if (req.userRole !== "Admin") {
      return res.status(403).json({
        message: "Only Admin can delete leave requests",
      });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        message: "Leave request not found",
      });
    }

    if (leave.status === "Approved") {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      const startDate = new Date(
        Date.UTC(
          start.getUTCFullYear(),
          start.getUTCMonth(),
          start.getUTCDate()
        )
      );

      const endDateExclusive = new Date(
        Date.UTC(
          end.getUTCFullYear(),
          end.getUTCMonth(),
          end.getUTCDate() + 1
        )
      );

      const ownerFilter =
        leave.applicantModel === "HR"
          ? { hr: leave.employee }
          : { employee: leave.employee };

      await Attendance.deleteMany({
        ...ownerFilter,
        status: "On Leave",
        date: {
          $gte: startDate,
          $lt: endDateExclusive,
        },
      });
    }

    await Leave.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Leave request deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;
