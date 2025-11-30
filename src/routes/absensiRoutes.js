const express = require("express");
const router = express.Router();
const absensiController = require("../controllers/absensiController");
const rekapAbsensiController = require("../controllers/rekapAbsensiController");
const { requireAuth } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

// Setup multer untuk upload foto
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/absensi");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(
            null,
            file.fieldname +
                "-" +
                uniqueSuffix +
                path.extname(file.originalname),
            file.fieldname +
                "-" +
                uniqueSuffix +
                path.extname(file.originalname),
        );
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(
            path.extname(file.originalname).toLowerCase(),
        );
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(
                new Error(
                    "Hanya file gambar (JPEG, JPG, PNG) yang diperbolehkan",
                ),
            );
            cb(
                new Error(
                    "Hanya file gambar (JPEG, JPG, PNG) yang diperbolehkan",
                ),
            );
        }
    },
});

// GET absensi untuk user yang login (with pagination)
router.get("/me", requireAuth, absensiController.getAbsensiForAuthUser);

// GET absensi hari ini untuk user yang login
router.get("/today", requireAuth, absensiController.getTodayAbsensi);

// GET rekap absensi dengan filter lengkap (untuk admin panel)
router.get("/rekap", rekapAbsensiController.getRekapAbsensi);

// GET summary statistik rekap
router.get("/rekap/summary", rekapAbsensiController.getRekapSummary);

// GET all absensi records
router.get("/", absensiController.getAllAbsensi);

// GET absensi by user (protected) - only same user can access
router.get("/user/:userId", requireAuth, absensiController.getAbsensiByUser);

// POST clock-in dengan upload foto
router.post(
    "/clock-in",
    requireAuth,
    upload.single("photo"),
    absensiController.clockIn,
);

// POST clock-out dengan upload foto
router.post(
    "/clock-out",
    requireAuth,
    upload.single("photo"),
    absensiController.clockOut,
);

module.exports = router;
