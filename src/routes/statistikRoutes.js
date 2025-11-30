const express = require("express");
const router = express.Router();
const statistikController = require("../controllers/statistikController");

// GET statistik absensi dengan grouping
router.get("/", statistikController.getStatistikAbsensi);

// GET status distribution untuk pie chart
router.get("/distribution", statistikController.getStatusDistribution);

module.exports = router;
