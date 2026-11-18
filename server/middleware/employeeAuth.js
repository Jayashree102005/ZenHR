
const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");

const employeeAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Employee access token required",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({
        message: "Invalid authentication details",
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Allow Employees only
    if (decoded.role !== "Employee") {
      return res.status(403).json({
        message: "Access denied. Employees only.",
      });
    }

    // Find employee
    const employee = await Employee.findById(decoded.id);

    if (!employee || employee.status !== "Active") {
      return res.status(401).json({
        message: "Employee account not found or inactive",
      });
    }

    // Attach employee details to request
    req.employee = employee;

    // Allow only password change before first-time password update
    const isChangePasswordRoute =
      req.method === "PUT" &&
      req.path === "/change-password";

    if (
      employee.mustChangePassword === true &&
      !isChangePasswordRoute
    ) {
      return res.status(403).json({
        message: "Please change your temporary password first",
        mustChangePassword: true,
      });
    }

    next();
  } catch (error) {
    console.error("Employee Auth Error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired employee token",
    });
  }
};

module.exports = employeeAuth;
