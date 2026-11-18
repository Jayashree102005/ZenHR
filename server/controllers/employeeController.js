
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const Employee = require("../models/Employee");
const HR = require("../models/HR");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Task = require("../models/Task");

const sendEmail = require("../utils/sendEmail");

// ========================================
// GET: All Active Employees + HR Accounts
// ========================================
const getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({
            status: "Active",
        }).lean();

        const hrAccounts = await HR.find()
            .select("-password")
            .lean();

        const formattedHR = hrAccounts.map((hr) => ({
            _id: hr._id,
            firstName: hr.firstName,
            lastName: hr.lastName,
            email: hr.email,
            phone: hr.phone || "",
            department: hr.department || "Human Resources",
            designation: hr.designation || "HR Manager",
            joiningDate: hr.joiningDate,
            salary: hr.salary,
            role: "HR",
            status: hr.status,
        }));

        res.status(200).json([
            ...employees,
            ...formattedHR,
        ]);
    } catch (error) {
        console.error("Get Employees Error:", error);

        res.status(500).json({
            message: "Error fetching employees",
            error: error.message,
        });
    }
};

// ========================================
// POST: Create Employee + Send Credentials
// ========================================
const createEmployee = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            department,
            designation,
            joiningDate,
            salary,
        } = req.body;

        if (
            !firstName ||
            !lastName ||
            !email ||
            !joiningDate ||
            salary === undefined ||
            salary === null ||
            salary === ""
        ) {
            return res.status(400).json({
                message: "Required employee details are missing.",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const parsedJoiningDate = new Date(joiningDate);
        const parsedSalary = Number(salary);

        if (Number.isNaN(parsedJoiningDate.getTime())) {
            return res.status(400).json({
                message: "Invalid joining date.",
            });
        }

        if (!Number.isFinite(parsedSalary) || parsedSalary < 0) {
            return res.status(400).json({
                message: "Invalid salary.",
            });
        }

        const existingEmployee = await Employee.findOne({
            email: normalizedEmail,
        });

        if (existingEmployee) {
            return res.status(409).json({
                message: "An employee with this email already exists.",
            });
        }

        const temporaryPassword = crypto
            .randomBytes(6)
            .toString("hex");

        const hashedPassword = await bcrypt.hash(
            temporaryPassword,
            10
        );

        const employee = await Employee.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            mustChangePassword: true,
            phone,
            department: department || "General",
            designation: designation || "Employee",
            role: "Employee",
            joiningDate: parsedJoiningDate,
            salary: parsedSalary,
            status: "Active",
        });

        await sendEmail({
            to: normalizedEmail,
            subject: "Welcome to ZenHR - Your Login Credentials",
            html: `
                <div style="font-family: Arial; padding: 24px;">
                    <h2>Welcome to ZenHR, ${employee.firstName}!</h2>
                    <p>Your employee account has been created.</p>
                    <p><strong>Login Email:</strong> ${employee.email}</p>
                    <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
                    <p>Please log in and change your temporary password.</p>
                    <p>Regards,<br/>ZenHR Team</p>
                </div>
            `,
        });

        res.status(201).json({
            message: "Employee created successfully. Credentials sent to email.",
            employee: {
                _id: employee._id,
                firstName: employee.firstName,
                lastName: employee.lastName,
                email: employee.email,
                phone: employee.phone,
                department: employee.department,
                designation: employee.designation,
                role: employee.role,
                joiningDate: employee.joiningDate,
                salary: employee.salary,
                status: employee.status,
            },
        });
    } catch (error) {
        console.error("Create Employee Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "An employee with this email already exists.",
            });
        }

        res.status(500).json({
            message: "Error creating employee.",
            error: error.message,
        });
    }
};

// ========================================
// POST: Employee Login
// ========================================
const loginEmployee = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required.",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const employee = await Employee.findOne({
            email: normalizedEmail,
        }).select("+password");

        if (!employee) {
            return res.status(401).json({
                message: "Invalid email or password.",
            });
        }

        if (employee.role !== "Employee") {
            return res.status(403).json({
                message: "This login is only for employees.",
            });
        }

        if (employee.status !== "Active") {
            return res.status(403).json({
                message: "Your employee account is inactive.",
            });
        }

        if (!employee.password) {
            return res.status(401).json({
                message: "Employee password is not configured. Contact Admin.",
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            employee.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password.",
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing in server environment.");
        }

        const token = jwt.sign(
            {
                id: employee._id,
                role: "Employee",
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d",
            }
        );

        res.status(200).json({
            message: "Employee login successful.",
            token,
            mustChangePassword: employee.mustChangePassword !== false,
            employee: {
                _id: employee._id,
                firstName: employee.firstName,
                lastName: employee.lastName,
                email: employee.email,
                phone: employee.phone,
                department: employee.department,
                designation: employee.designation,
                role: employee.role,
                joiningDate: employee.joiningDate,
            },
        });
    } catch (error) {
        console.error("Employee Login Error:", error.stack || error);

        res.status(500).json({
            message: "Error logging in.",
            error: error.message,
        });
    }
};

// ========================================
// PUT: Change Employee Password
// ========================================
const changeEmployeePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required.",
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                message: "New password must contain at least 8 characters.",
            });
        }

        const employee = await Employee.findById(
            req.employee._id
        ).select("+password");

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found.",
            });
        }

        const isMatch = await bcrypt.compare(
            currentPassword,
            employee.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Current password is incorrect.",
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                message: "New password must be different.",
            });
        }

        employee.password = await bcrypt.hash(newPassword, 10);
        employee.mustChangePassword = false;

        await employee.save();

        res.status(200).json({
            message: "Password changed successfully.",
        });
    } catch (error) {
        console.error("Employee Change Password Error:", error);

        res.status(500).json({
            message: "Error changing password.",
            error: error.message,
        });
    }
};

// ========================================
// PUT: Update Employee
// ========================================
const updateEmployee = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            department,
            designation,
            joiningDate,
            salary,
        } = req.body;

        if (
            !firstName ||
            !lastName ||
            !email ||
            !joiningDate ||
            salary === undefined ||
            salary === null ||
            salary === ""
        ) {
            return res.status(400).json({
                message: "Required employee details are missing.",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const parsedJoiningDate = new Date(joiningDate);
        const parsedSalary = Number(salary);

        if (Number.isNaN(parsedJoiningDate.getTime())) {
            return res.status(400).json({
                message: "Invalid joining date.",
            });
        }

        if (!Number.isFinite(parsedSalary) || parsedSalary < 0) {
            return res.status(400).json({
                message: "Invalid salary.",
            });
        }

        const existingEmployee = await Employee.findOne({
            email: normalizedEmail,
            _id: { $ne: req.params.id },
        });

        if (existingEmployee) {
            return res.status(409).json({
                message: "An employee with this email already exists.",
            });
        }

        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: normalizedEmail,
                phone,
                department,
                designation,
                joiningDate: parsedJoiningDate,
                salary: parsedSalary,
                role: "Employee",
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found.",
            });
        }

        res.status(200).json({
            message: "Employee updated successfully.",
            employee,
        });
    } catch (error) {
        console.error("Update Employee Error:", error);

        res.status(400).json({
            message: "Error updating employee.",
            error: error.message,
        });
    }
};

// ========================================
// DELETE: Deactivate Employee
// ========================================
const deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found.",
            });
        }

        if (employee.status === "Inactive") {
            return res.status(400).json({
                message: "Employee is already inactive.",
            });
        }

        employee.status = "Inactive";
        await employee.save();

        res.status(200).json({
            message: "Employee deactivated successfully.",
            employee,
        });
    } catch (error) {
        console.error("Deactivate Employee Error:", error);

        res.status(500).json({
            message: "Error deactivating employee.",
            error: error.message,
        });
    }
};

// ========================================
// DELETE: Permanently Delete Employee
// ========================================
const permanentlyDeleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found.",
            });
        }

        await Attendance.deleteMany({
            employee: employee._id,
        });

        await Leave.deleteMany({
            employee: employee._id,
        });

        await Task.deleteMany({
            assignedTo: employee._id,
        });

        await Employee.findByIdAndDelete(employee._id);

        res.status(200).json({
            message: "Employee and related records permanently deleted.",
        });
    } catch (error) {
        console.error("Permanent Delete Employee Error:", error);

        res.status(500).json({
            message: "Error permanently deleting employee.",
            error: error.message,
        });
    }
};

// ========================================
// EXPORTS
// ========================================
module.exports = {
    getEmployees,
    createEmployee,
    loginEmployee,
    changeEmployeePassword,
    updateEmployee,
    deleteEmployee,
    permanentlyDeleteEmployee,
};
