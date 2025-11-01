const express = require("express");
const router = express.Router();
const lokasiController = require("../controllers/lokasiController");

// GET lokasi terdekat (harus di atas /:id)
router.get("/terdekat", lokasiController.getLokasiTerdekat);

// GET all lokasi kantor
router.get("/", lokasiController.getAllLokasi);

// GET single lokasi
router.get("/:id", lokasiController.getLokasiById);

// POST create lokasi
router.post("/", lokasiController.createLokasi);

// PUT update lokasi
router.put("/:id", lokasiController.updateLokasi);

// DELETE lokasi
router.delete("/:id", lokasiController.deleteLokasi);

module.exports = router;
