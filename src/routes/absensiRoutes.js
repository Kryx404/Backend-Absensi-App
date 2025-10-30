const express = require('express');
const router = express.Router();
const absensiController = require('../controllers/absensiController');

// GET all absensi records
router.get('/', absensiController.getAllAbsensi);

// GET absensi by user
router.get('/user/:userId', absensiController.getAbsensiByUser);

// POST create absensi (check-in)
router.post('/checkin', absensiController.checkIn);

// PUT update absensi (check-out)
router.put('/checkout/:id', absensiController.checkOut);

module.exports = router;
