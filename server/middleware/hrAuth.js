
const jwt = require("jsonwebtoken");
const HR = require("../models/HR");

const hrAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. HR token required.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({
        message: "Invalid authentication details.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Check whether token belongs to HR
    if (decoded.role !== "HR") {
      return res.status(403).json({
        message: "Access denied. HR only.",
      });
    }

    const hr = await HR.findById(decoded.id);

    if (!hr || hr.status !== "Active") {
      return res.status(401).json({
        message: "HR account not found or inactive.",
      });
    }

    // Attach HR details to request
    req.hr = hr;

    // Allow password change API during first login
    const isPasswordChangeRoute =
      req.method === "PUT" &&
      req.path === "/change-password";

    // Block other protected routes until password is changed
    if (
      hr.mustChangePassword !== false &&
      !isPasswordChangeRoute
    ) {
      return res.status(403).json({
        message: "Please change your temporary password first.",
        mustChangePassword: true,
      });
    }

    next();
  } catch (error) {
    console.error("HR authentication error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired HR token.",
    });
  }
};

module.exports = hrAuth;
