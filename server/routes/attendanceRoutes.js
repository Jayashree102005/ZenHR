
const express = require("express");
const Attendance = require("../models/Attendance");

const adminAuth = require("../middleware/adminAuth");
const employeeReadAuth = require("../middleware/employeeReadAuth");
const employeeAuth = require("../middleware/employeeAuth");

const router = express.Router();

// ==========================================
// HELPER: START AND END OF A DAY
// ==========================================
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

// ==========================================
// HELPER: START AND END OF A MONTH
// ==========================================
const getMonthRange = (year, month) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  return { start, end };
};

// ==========================================
// HELPER: GET ATTENDANCE STATUS
// ==========================================
const getAttendanceStatus = (checkInTime) => {
  const officeStartTime =
    process.env.OFFICE_START_TIME || "09:30";

  const graceMinutes = Number(
    process.env.LATE_GRACE_MINUTES || 10
  );

  const [hours, minutes] = officeStartTime
    .split(":")
    .map(Number);

  const officeStart = new Date(checkInTime);
  officeStart.setHours(hours, minutes, 0, 0);

  const allowedCheckInTime = new Date(officeStart);

  allowedCheckInTime.setMinutes(
    allowedCheckInTime.getMinutes() + graceMinutes
  );

  return checkInTime <= allowedCheckInTime
    ? "Present"
    : "Late";
};

// ==========================================
// GET ATTENDANCE
// ADMIN + HR
// ==========================================
router.get("/", employeeReadAuth, async (req, res) => {
  try {
    const filter = {};

    if (req.userRole === "HR") {
      filter.$or = [
        { employee: { $ne: null } },
        { hr: req.hr._id },
      ];
    }

    if (req.query.year && req.query.month) {
      const year = Number(req.query.year);
      const month = Number(req.query.month);

      if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12
      ) {
        return res.status(400).json({
          message: "Invalid year or month",
        });
      }

      const { start, end } = getMonthRange(year, month);

      filter.date = {
        $gte: start,
        $lt: end,
      };
    }

    const attendance = await Attendance.find(filter)
      .populate(
        "employee",
        "firstName lastName department designation"
      )
      .populate("hr", "firstName lastName email")
      .sort({ date: -1 });

    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ==========================================
// EMPLOYEE: GET MY TODAY'S ATTENDANCE
// ==========================================
router.get("/employee/my/today", employeeAuth, async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    const attendance = await Attendance.findOne({
      employee: req.employee._id,
      date: { $gte: start, $lt: end },
    });

    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ==========================================
// EMPLOYEE: GET MY ATTENDANCE HISTORY
// ==========================================
router.get("/employee/my", employeeAuth, async (req, res) => {
  try {
    const filter = {
      employee: req.employee._id,
    };

    if (req.query.year && req.query.month) {
      const year = Number(req.query.year);
      const month = Number(req.query.month);

      if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12
      ) {
        return res.status(400).json({
          message: "Invalid year or month",
        });
      }

      const { start, end } = getMonthRange(year, month);

      filter.date = {
        $gte: start,
        $lt: end,
      };
    }

    const attendance = await Attendance.find(filter)
      .sort({ date: -1 });

    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ==========================================
// EMPLOYEE: CHECK IN
// ==========================================
router.post("/employee/my/check-in", employeeAuth, async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    const existingAttendance = await Attendance.findOne({
      employee: req.employee._id,
      date: { $gte: start, $lt: end },
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: "You have already checked in today",
      });
    }

    const checkInTime = new Date();

    const attendance = await Attendance.create({
      employee: req.employee._id,
      date: start,
      checkIn: checkInTime,
      status: getAttendanceStatus(checkInTime),
    });

    res.status(201).json({
      message: "Check-in successful",
      attendance,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ==========================================
// EMPLOYEE: CHECK OUT
// ==========================================
router.put(
  "/employee/my/check-out/:id",
  employeeAuth,
  async (req, res) => {
    try {
      const attendance = await Attendance.findOne({
        _id: req.params.id,
        employee: req.employee._id,
      });

      if (!attendance) {
        return res.status(404).json({
          message: "Attendance record not found",
        });
      }

      if (!attendance.checkIn) {
        return res.status(400).json({
          message: "You have not checked in yet",
        });
      }

      if (attendance.checkOut) {
        return res.status(400).json({
          message: "You have already checked out",
        });
      }

      attendance.checkOut = new Date();

      await attendance.save();

      res.status(200).json({
        message: "Check-out successful",
        attendance,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

// ==========================================
// HR: GET MY TODAY'S ATTENDANCE
// ==========================================
router.get("/my/today", employeeReadAuth, async (req, res) => {
  try {
    if (req.userRole !== "HR") {
      return res.status(403).json({
        message: "Only HR can access this route",
      });
    }

    const { start, end } = getTodayRange();

    const attendance = await Attendance.findOne({
      hr: req.hr._id,
      date: { $gte: start, $lt: end },
    });

    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ==========================================
// HR: CHECK IN
// ==========================================
router.post("/my/check-in", employeeReadAuth, async (req, res) => {
  try {
    if (req.userRole !== "HR") {
      return res.status(403).json({
        message: "Only HR can check in here",
      });
    }

    const { start, end } = getTodayRange();

    const existingAttendance = await Attendance.findOne({
      hr: req.hr._id,
      date: { $gte: start, $lt: end },
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: "You have already checked in today",
      });
    }

    const checkInTime = new Date();

    const attendance = await Attendance.create({
      hr: req.hr._id,
      date: start,
      checkIn: checkInTime,
      status: getAttendanceStatus(checkInTime),
    });

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ==========================================
// HR: CHECK OUT
// ==========================================
router.put("/my/check-out/:id", employeeReadAuth, async (req, res) => {
  try {
    if (req.userRole !== "HR") {
      return res.status(403).json({
        message: "Only HR can check out here",
      });
    }

    const attendance = await Attendance.findOne({
      _id: req.params.id,
      hr: req.hr._id,
    });

    if (!attendance) {
      return res.status(404).json({
        message: "Your attendance record was not found",
      });
    }

    if (!attendance.checkIn) {
      return res.status(400).json({
        message: "You have not checked in yet",
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        message: "You have already checked out",
      });
    }

    attendance.checkOut = new Date();

    await attendance.save();

    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ==========================================
// ADMIN: EMPLOYEE CHECK IN
// ==========================================
router.post("/check-in", adminAuth, async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        message: "Employee ID is required",
      });
    }

    const { start, end } = getTodayRange();

    const existingAttendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: start, $lt: end },
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: "Attendance already marked for today",
      });
    }

    const checkInTime = new Date();

    const attendance = await Attendance.create({
      employee: employeeId,
      date: start,
      checkIn: checkInTime,
      status: getAttendanceStatus(checkInTime),
    });

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ==========================================
// ADMIN: EMPLOYEE CHECK OUT
// ==========================================
router.put("/check-out/:id", adminAuth, async (req, res) => {
  try {
    const attendance = await Attendance.findOne({
      _id: req.params.id,
      employee: { $ne: null },
    });

    if (!attendance) {
      return res.status(404).json({
        message: "Employee attendance record not found",
      });
    }

    if (!attendance.checkIn) {
      return res.status(400).json({
        message: "Employee has not checked in yet",
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        message: "Employee has already checked out",
      });
    }

    attendance.checkOut = new Date();

    await attendance.save();

    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;
