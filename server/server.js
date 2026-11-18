
const dotenv = require("dotenv");

// Load environment variables first
dotenv.config();

const cors = require("cors");
const express = require("express");
const connectDB = require("./config/db");

// Import Routes
const employeeRoutes = require("./routes/employeeRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const taskRoutes = require("./routes/taskRoutes");
const projectRoutes = require("./routes/projectRoutes");
const clientRoutes = require("./routes/clientRoutes");
const leadRoutes = require("./routes/leadRoutes");
const dealRoutes = require("./routes/dealRoutes");
const activityRoutes = require("./routes/activityRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const hrRoutes = require("./routes/hrRoutes");
const hrDashboardRoutes = require("./routes/hrDashboardRoutes");
const payslipRoutes = require("./routes/payslipRoutes");

// Initialize Express
const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());

// ==========================================
// API ROUTES
// ==========================================

app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/hr-dashboard", hrDashboardRoutes);
app.use("/api/payslips", payslipRoutes);

// ==========================================
// WELCOME ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.send("Welcome to ZenHR Backend!");
});

// ==========================================
// HEALTH CHECK ROUTE
// ==========================================

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ZenHR Backend is running successfully",
  });
});

// ==========================================
// MONGODB CONNECTION AND SERVER START
// ==========================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`ZenHR server is running on port ${PORT}`);

      console.log(
        "EMAIL_USER loaded:",
        Boolean(process.env.EMAIL_USER)
      );

      console.log(
        "EMAIL_PASS loaded:",
        Boolean(process.env.EMAIL_PASS)
      );
    });
  } catch (error) {
    console.error("Failed to start ZenHR server:", error.message);
    process.exit(1);
  }
};

startServer();
