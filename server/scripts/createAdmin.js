require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "admin@zenhr.com";
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash("Admin@12345", 10);

    await Admin.create({
      name: "ZenHR Admin",
      email,
      password: hashedPassword,
      role: "Admin",
    });

    console.log("Admin created successfully");
    console.log("Email: admin@zenhr.com");
    console.log("Password: Admin@12345");
  } catch (error) {
    console.error("Error creating admin:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
