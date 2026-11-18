
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const HR = require("../models/HR");

const employeeReadAuth = async (req, res, next) => {
  try {
    // 1. Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access token required",
      });
    }

    // 2. Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token is missing",
      });
    }

    // 3. Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing in .env");

      return res.status(500).json({
        message: "Server authentication configuration error",
      });
    }

    // 4. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Admin authentication
    if (decoded.role === "Admin") {
      const admin = await Admin.findById(decoded.id);

      if (!admin) {
        return res.status(401).json({
          message: "Admin account not found",
        });
      }

      req.admin = admin;
      req.userRole = "Admin";

      return next();
    }

    // 6. HR authentication
    if (decoded.role === "HR") {
      const hr = await HR.findById(decoded.id);

      if (!hr) {
        return res.status(401).json({
          message: "HR account not found",
        });
      }

      if (hr.status !== "Active") {
        return res.status(403).json({
          message: "HR account is inactive",
        });
      }

      req.hr = hr;
      req.userRole = "HR";

      return next();
    }

    // 7. Unknown role
    return res.status(403).json({
      message: "Access denied. Admin or HR only.",
    });
  } catch (error) {
    console.error("Employee Read Auth Error:", error);

    // JWT token errors
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        message: error.message,
      });
    }

    // Database or other errors
    return res.status(500).json({
      message: "Authentication failed due to server error",
    });
  }
};

module.exports = employeeReadAuth;
