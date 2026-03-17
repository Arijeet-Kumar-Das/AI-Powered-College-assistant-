// scripts/createAdmin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Admin = require("../models/Admin");

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);

  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = new Admin({
    name: "Arijeet",
    email: "arijeet@gmail.com",
    phone: "8402064033",
    username: "admin",
    passwordHash,
  });

  await admin.save();
  console.log("Admin user created!");
  process.exit();
}
createAdmin();
