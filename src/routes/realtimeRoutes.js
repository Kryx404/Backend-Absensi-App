const express = require("express");
const router = express.Router();
const realtimeController = require("../controllers/realtimeController");

// GET realtime attendance status
router.get("/", realtimeController.getRealtimeStatus);

module.exports = router;
