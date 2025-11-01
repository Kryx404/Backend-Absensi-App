const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST login
router.post('/login', authController.login);

// POST logout
router.post('/logout', authController.logout);

module.exports = router;
