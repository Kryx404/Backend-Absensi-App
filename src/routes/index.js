const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const absensiRoutes = require('./absensiRoutes');

// Mount routes
router.use('/users', userRoutes);
router.use('/absensi', absensiRoutes);

module.exports = router;
