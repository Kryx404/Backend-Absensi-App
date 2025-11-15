const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// POST login
router.post("/login", authController.login);

// POST logout (protected)
const { requireAuth } = require("../middleware/authMiddleware");
router.post("/logout", requireAuth, authController.logout);

module.exports = router;
