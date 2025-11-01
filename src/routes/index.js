const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const absensiRoutes = require("./absensiRoutes");
const lokasiRoutes = require("./lokasiRoutes");

// Mount routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/absensi", absensiRoutes);
router.use("/lokasi", lokasiRoutes);

module.exports = router;
