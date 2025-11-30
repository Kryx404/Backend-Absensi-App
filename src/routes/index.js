const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const absensiRoutes = require("./absensiRoutes");
const lokasiRoutes = require("./lokasiRoutes");
const statistikRoutes = require("./statistikRoutes");
const realtimeRoutes = require("./realtimeRoutes");

// Mount routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/absensi", absensiRoutes);
router.use("/lokasi", lokasiRoutes);
router.use("/statistik", statistikRoutes);
router.use("/realtime", realtimeRoutes);

module.exports = router;
