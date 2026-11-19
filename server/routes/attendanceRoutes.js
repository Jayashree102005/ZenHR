
const express = require("express");
const Attendance = require("../models/Attendance");
const Settings = require("../models/Settings");

const adminAuth = require("../middleware/adminAuth");
const employeeReadAuth = require("../middleware/employeeReadAuth");
const employeeAuth = require("../middleware/employeeAuth");

const router = express.Router();

// ==========================================
// COMPANY TIMEZONE
// ==========================================
const TIME_ZONE = "Asia/Kolkata";
const TIME_OFFSET = "+05:30";

// ==========================================
// HELPER: GET DATE KEY IN COMPANY TIMEZONE
// ==========================================
const getDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  });

  return `${values.year}-${values.month}-${values.day}`;
};

// ==========================================
// HELPER: CONVERT COMPANY LOCAL TIME TO DATE
// ==========================================
const getCompanyDate = (dateKey, time = "00:00") => {
  return new Date(`${dateKey}T${time}:00${TIME_OFFSET}`);
};

// ==========================================
// HELPER: START AND END OF TODAY
// ==========================================
const getTodayRange = () => {
  const todayKey = getDateKey();

  const start = getCompanyDate(todayKey);

  const tomorrow = new Date(start);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  return {
    start,
    end: tomorrow,
    dateKey: todayKey,
  };
};

// ==========================================
// HELPER: START AND END OF A MONTH
// ==========================================
const getMonthRange = (year, month) => {
  const start = getCompanyDate(
    `${year}-${String(month).padStart(2, "0")}-01`
  );

  const nextMonth = new Date(
    Date.UTC(year, month, 1) - 330 * 60 * 1000
  );

  return {
    start,
    end: nextMonth,
  };
};

// ==========================================
// HELPER: GET OFFICE SETTINGS
// ==========================================
const getOfficeSettings = async () => {
  const settings = await Settings.findOne();

  return {
    officeStartTime: settings?.officeStartTime || "09:00",
    officeEndTime: settings?.officeEndTime || "18:00",
    gracePeriodMinutes: settings?.gracePeriodMinutes ?? 15,
    workingDays: settings?.workingDays?.length
      ? settings.workingDays
      : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  };
};

// ==========================================
// HELPER: GET DAY NAME
// ==========================================
const getDayName = (date = new Date()) => {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "long",
  }).format(date);
};

// ==========================================
// HELPER: CHECK WORKING DAY
// ==========================================
const isWorkingDay = (date, workingDays) => {
  const dayName = getDayName(date);

  return workingDays.includes(dayName);
};

// ==========================================
// HELPER: GET TIME IN MINUTES
// ==========================================
const getTimeInMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

// ==========================================
// HELPER: GET ATTENDANCE STATUS
// ==========================================
const getAttendanceStatus = (checkInTime, settings) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(checkInTime);

  const values = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  });

  const checkInMinutes =
    Number(values.hour) * 60 + Number(values.minute);

  const officeStartMinutes = getTimeInMinutes(
    settings.officeStartTime
  );

  const allowedMinutes =
    officeStartMinutes + settings.gracePeriodMinutes;

  return checkInMinutes <= allowedMinutes
    ? "Present"
    : "Late";
};

// ==========================================
// HELPER: VALIDATE WORKING DAY
// ==========================================
const validateWorkingDay = (settings) => {
  const today = new Date();

  if (!isWorkingDay(today, settings.workingDays)) {
    return {
      valid: false,
      message: "Today is not a company working day",
    };
  }

  return { valid: true };
};

// ==========================================
// HELPER: CREATE ATTENDANCE
// ==========================================
const createAttendance = async (personField, personId) => {
  const settings = await getOfficeSettings();

  const workingDayValidation = validateWorkingDay(settings);

  if (!workingDayValidation.valid) {
    return {
      error: workingDayValidation.message,
      statusCode: 400,
    };
  }

  const { start, end } = getTodayRange();

  const existingAttendance = await Attendance.findOne({
    [personField]: personId,
    date: { $gte: start, $lt: end },
  });

  if (existingAttendance) {
    return {
      error: "You have already checked in today",
      statusCode: 400,
    };
  }

  const checkInTime = new Date();

  const attendance = await Attendance.create({
    [personField]: personId,
    date: start,
    checkIn: checkInTime,
    status: getAttendanceStatus(checkInTime, settings),
  });

  return { attendance };
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
    const result = await createAttendance(
      "employee",
      req.employee._id
    );

    if (result.error) {
      return res.status(result.statusCode).json({
        message: result.error,
      });
    }

    res.status(201).json({
      message: "Check-in successful",
      attendance: result.attendance,
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

    const result = await createAttendance("hr", req.hr._id);

    if (result.error) {
      return res.status(result.statusCode).json({
        message: result.error,
      });
    }

    res.status(201).json(result.attendance);
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

    const result = await createAttendance("employee", employeeId);

    if (result.error) {
      return res.status(result.statusCode).json({
        message: result.error,
      });
    }

    res.status(201).json(result.attendance);
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
