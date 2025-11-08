const { query } = require("../config/database");

// GET all lokasi kantor
const getAllLokasi = async (req, res) => {
    try {
        const results = await query(
            "SELECT * FROM lokasi_kantor WHERE is_active = TRUE ORDER BY nama_kantor",
        );

        res.json({
            success: true,
            message: "Data lokasi kantor berhasil diambil",
            data: results,
        });
    } catch (error) {
        console.error("Get all lokasi error:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data lokasi",
            error: error.message,
        });
    }
};

// GET single lokasi by ID
const getLokasiById = async (req, res) => {
    try {
        const { id } = req.params;

        const results = await query(
            "SELECT * FROM lokasi_kantor WHERE id = ?",
            [id],
        );

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lokasi kantor tidak ditemukan",
            });
        }

        res.json({
            success: true,
            message: "Data lokasi kantor berhasil diambil",
            data: results[0],
        });
    } catch (error) {
        console.error("Get lokasi by ID error:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data lokasi",
            error: error.message,
        });
    }
};

// POST create lokasi kantor
const createLokasi = async (req, res) => {
    try {
        const { namaKantor, alamat, latitude, longitude, radius } = req.body;

        // Validasi input
        if (
            !namaKantor ||
            !alamat ||
            latitude === undefined ||
            longitude === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Nama kantor, alamat, latitude, dan longitude wajib diisi",
            });
        }

        // Validasi tipe data
        if (typeof latitude !== "number" || typeof longitude !== "number") {
            return res.status(400).json({
                success: false,
                message: "Latitude dan longitude harus berupa angka",
            });
        }

        // Validasi range latitude dan longitude
        if (
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Latitude harus antara -90 sampai 90, longitude antara -180 sampai 180",
            });
        }

        // Insert lokasi baru
        const result = await query(
            `INSERT INTO lokasi_kantor (nama_kantor, alamat, latitude, longitude, radius, is_active)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [namaKantor, alamat, latitude, longitude, radius || 100, true],
        );

        // Ambil data yang baru dibuat
        const newLokasi = await query(
            "SELECT * FROM lokasi_kantor WHERE id = ?",
            [result.insertId],
        );

        res.status(201).json({
            success: true,
            message: "Lokasi kantor berhasil ditambahkan",
            data: newLokasi[0],
        });
    } catch (error) {
        console.error("Create lokasi error:", error);
        res.status(500).json({
            success: false,
            message: "Gagal menambahkan lokasi",
            error: error.message,
        });
    }
};

// PUT update lokasi kantor
const updateLokasi = async (req, res) => {
    try {
        const { id } = req.params;
        const { namaKantor, alamat, latitude, longitude, radius, is_active } =
            req.body;

        // Cek apakah lokasi exists
        const existing = await query(
            "SELECT id FROM lokasi_kantor WHERE id = ?",
            [id],
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lokasi kantor tidak ditemukan",
            });
        }

        // Validasi tipe data jika latitude/longitude diubah
        if (latitude !== undefined && typeof latitude !== "number") {
            return res.status(400).json({
                success: false,
                message: "Latitude harus berupa angka",
            });
        }

        if (longitude !== undefined && typeof longitude !== "number") {
            return res.status(400).json({
                success: false,
                message: "Longitude harus berupa angka",
            });
        }

        // Validasi range jika latitude/longitude diubah
        if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
            return res.status(400).json({
                success: false,
                message: "Latitude harus antara -90 sampai 90",
            });
        }

        if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
            return res.status(400).json({
                success: false,
                message: "Longitude harus antara -180 sampai 180",
            });
        }

        // Update data
        await query(
            `UPDATE lokasi_kantor SET
                nama_kantor = COALESCE(?, nama_kantor),
                alamat = COALESCE(?, alamat),
                latitude = COALESCE(?, latitude),
                longitude = COALESCE(?, longitude),
                radius = COALESCE(?, radius),
                is_active = COALESCE(?, is_active)
            WHERE id = ?`,
            [namaKantor, alamat, latitude, longitude, radius, is_active, id],
        );

        // Ambil data yang sudah diupdate
        const updated = await query(
            "SELECT * FROM lokasi_kantor WHERE id = ?",
            [id],
        );

        res.json({
            success: true,
            message: "Lokasi kantor berhasil diupdate",
            data: updated[0],
        });
    } catch (error) {
        console.error("Update lokasi error:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengupdate lokasi",
            error: error.message,
        });
    }
};

// DELETE lokasi kantor
const deleteLokasi = async (req, res) => {
    try {
        const { id } = req.params;

        // Cek apakah lokasi exists
        const existing = await query(
            "SELECT id, nama_kantor FROM lokasi_kantor WHERE id = ?",
            [id],
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lokasi kantor tidak ditemukan",
            });
        }

        // Cek apakah ada absensi yang menggunakan lokasi ini
        const absensiCheck = await query(
            "SELECT COUNT(*) as count FROM absensi WHERE lokasi_id = ?",
            [id],
        );

        if (absensiCheck[0].count > 0) {
            // Jika ada absensi, soft delete dengan set is_active = false
            await query(
                "UPDATE lokasi_kantor SET is_active = FALSE WHERE id = ?",
                [id],
            );

            return res.json({
                success: true,
                message:
                    "Lokasi kantor dinonaktifkan (sudah ada data absensi terkait)",
            });
        }

        // Jika tidak ada absensi, hard delete
        await query("DELETE FROM lokasi_kantor WHERE id = ?", [id]);

        res.json({
            success: true,
            message: "Lokasi kantor berhasil dihapus",
        });
    } catch (error) {
        console.error("Delete lokasi error:", error);
        res.status(500).json({
            success: false,
            message: "Gagal menghapus lokasi",
            error: error.message,
        });
    }
};

// GET lokasi terdekat berdasarkan koordinat user
const getLokasiTerdekat = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: "Latitude dan longitude wajib diisi",
            });
        }

        const userLat = parseFloat(latitude);
        const userLon = parseFloat(longitude);

        if (isNaN(userLat) || isNaN(userLon)) {
            return res.status(400).json({
                success: false,
                message: "Latitude dan longitude harus berupa angka",
            });
        }

        // Query dengan Haversine formula untuk menghitung jarak
        const results = await query(
            `SELECT 
                *,
                (6371000 * ACOS(
                    COS(RADIANS(?)) * COS(RADIANS(latitude)) * 
                    COS(RADIANS(longitude) - RADIANS(?)) + 
                    SIN(RADIANS(?)) * SIN(RADIANS(latitude))
                )) AS jarak_dari_user
            FROM lokasi_kantor
            WHERE is_active = TRUE
            ORDER BY jarak_dari_user
            LIMIT 10`,
            [userLat, userLon, userLat],
        );

        // Round jarak ke integer
        const lokasiWithDistance = results.map((lokasi) => ({
            ...lokasi,
            jarakDariUser: Math.round(lokasi.jarak_dari_user),
        }));

        res.json({
            success: true,
            message: "Data lokasi kantor terdekat berhasil diambil",
            data: lokasiWithDistance,
        });
    } catch (error) {
        console.error("Get lokasi terdekat error:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data lokasi terdekat",
            error: error.message,
        });
    }
};

module.exports = {
    getAllLokasi,
    getLokasiById,
    createLokasi,
    updateLokasi,
    deleteLokasi,
    getLokasiTerdekat,
};
