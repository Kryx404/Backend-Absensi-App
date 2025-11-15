const { query } = require("../config/database");

// GET all absensi records
exports.getAllAbsensi = async (req, res) => {
    try {
        const results = await query(
            `SELECT 
                a.*,
                u.nik,
                u.name as user_name,
                u.position,
                l.nama_kantor,
                l.alamat as alamat_kantor
            FROM absensi a
            JOIN users u ON a.user_id = u.id
            JOIN lokasi_kantor l ON a.lokasi_id = l.id
            ORDER BY a.tanggal DESC, a.clock_in_time DESC
            LIMIT 100`,
        );

        res.json({
            success: true,
            data: results,
            count: results.length,
        });
    } catch (error) {
        console.error("Get all absensi error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// GET absensi by user ID
exports.getAbsensiByUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        // Allow only the same authenticated user to fetch their data
        const authUserId = req.user && req.user.id;
        if (!authUserId) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized" });
        }

        if (authUserId !== userId) {
            return res
                .status(403)
                .json({ success: false, message: "Forbidden" });
        }

        const results = await query(
            `SELECT 
                a.*,
                l.nama_kantor,
                l.alamat as alamat_kantor
            FROM absensi a
            JOIN lokasi_kantor l ON a.lokasi_id = l.id
            WHERE a.user_id = ?
            ORDER BY a.tanggal DESC
            LIMIT 30`,
            [userId],
        );

        res.json({
            success: true,
            data: results,
            count: results.length,
        });
    } catch (error) {
        console.error("Get absensi by user error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// GET absensi for authenticated user
exports.getAbsensiForAuthUser = async (req, res) => {
    try {
        const userId = req.user && req.user.id;
        if (!userId) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized" });
        }

        // Optional query params: limit, offset
        const limit = parseInt(req.query.limit, 10) || 30;
        const offset = parseInt(req.query.offset, 10) || 0;

        const results = await query(
            `SELECT 
                a.*, 
                l.nama_kantor, 
                l.alamat as alamat_kantor
            FROM absensi a
            JOIN lokasi_kantor l ON a.lokasi_id = l.id
            WHERE a.user_id = ?
            ORDER BY a.tanggal DESC, a.clock_in_time DESC
            LIMIT ? OFFSET ?`,
            [userId, limit, offset],
        );

        res.json({ success: true, data: results, count: results.length });
    } catch (error) {
        console.error("Get absensi for auth user error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// Get today's absensi for logged in user
exports.getTodayAbsensi = async (req, res) => {
    try {
        const userId = req.user && req.user.id;
        if (!userId) {
            return res
                .status(401)
                .json({
                    success: false,
                    message: "Unauthorized: user not authenticated",
                });
        }
        const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

        // Cari absensi hari ini untuk user ini
        const results = await query(
            `SELECT 
                id,
                clock_in_time,
                clock_out_time,
                clock_in_latitude,
                clock_in_longitude,
                clock_in_address,
                clock_out_latitude,
                clock_out_longitude,
                clock_out_address,
                clock_in_photo,
                clock_out_photo,
                status,
                durasi_kerja
            FROM absensi 
            WHERE user_id = ? AND tanggal = ?`,
            [userId, today],
        );

        if (results.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    clock_in: null,
                    clock_out: null,
                },
            });
        }

        const absensi = results[0];

        res.status(200).json({
            success: true,
            data: {
                id: absensi.id,
                clock_in: absensi.clock_in_time,
                clock_out: absensi.clock_out_time,
                check_in_location: {
                    latitude: absensi.clock_in_latitude,
                    longitude: absensi.clock_in_longitude,
                    address: absensi.clock_in_address,
                },
                check_out_location: absensi.clock_out_latitude
                    ? {
                          latitude: absensi.clock_out_latitude,
                          longitude: absensi.clock_out_longitude,
                          address: absensi.clock_out_address,
                      }
                    : null,
                photo_in: absensi.clock_in_photo,
                photo_out: absensi.clock_out_photo,
                status: absensi.status,
                durasi_kerja: absensi.durasi_kerja,
            },
        });
    } catch (error) {
        console.error("Error getting today absensi:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mendapatkan data absensi hari ini",
            error: error.message,
        });
    }
};

// POST clock-in
exports.clockIn = async (req, res) => {
    try {
        const userId = req.user && req.user.id;
        if (!userId) {
            return res
                .status(401)
                .json({
                    success: false,
                    message: "Unauthorized: user not authenticated",
                });
        }

        const {
            timestamp,
            latitude,
            longitude,
            address,
            distance_from_office,
            lokasi_id,
        } = req.body;

        // Validasi input
        if (!latitude || !longitude || !lokasi_id) {
            return res.status(400).json({
                success: false,
                message: "Latitude, longitude, dan lokasi_id wajib diisi",
            });
        }

        const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

        // Cek apakah sudah clock-in hari ini
        const existing = await query(
            "SELECT id FROM absensi WHERE user_id = ? AND tanggal = ?",
            [userId, today],
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Anda sudah melakukan clock-in hari ini",
            });
        }

        // Simpan foto path jika ada
        let photoPath = null;
        if (req.file) {
            photoPath = req.file.path;
        }

        // Insert absensi baru
        const result = await query(
            `INSERT INTO absensi (
                user_id, lokasi_id, tanggal,
                clock_in_time, clock_in_latitude, clock_in_longitude,
                clock_in_address, clock_in_distance, clock_in_photo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                lokasi_id,
                today,
                timestamp || new Date(),
                latitude,
                longitude,
                address || "Unknown",
                distance_from_office || 0,
                photoPath,
            ],
        );

        res.status(201).json({
            success: true,
            message: "Clock-in berhasil",
            data: {
                id: result.insertId,
                clock_in: timestamp || new Date(),
                check_in_location: {
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    address: address || "Unknown",
                },
                distance_from_office: distance_from_office || 0,
            },
        });
    } catch (error) {
        console.error("Error clock-in:", error);
        res.status(500).json({
            success: false,
            message: "Gagal melakukan clock-in",
            error: error.message,
        });
    }
};

// POST clock-out
exports.clockOut = async (req, res) => {
    try {
        const userId = req.user && req.user.id;
        if (!userId) {
            return res
                .status(401)
                .json({
                    success: false,
                    message: "Unauthorized: user not authenticated",
                });
        }

        const {
            timestamp,
            latitude,
            longitude,
            address,
            distance_from_office,
        } = req.body;

        // Validasi input
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: "Latitude dan longitude wajib diisi",
            });
        }

        const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

        // Cari absensi hari ini
        const absensiData = await query(
            "SELECT * FROM absensi WHERE user_id = ? AND tanggal = ?",
            [userId, today],
        );

        if (absensiData.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Anda belum melakukan clock-in hari ini",
            });
        }

        const absensi = absensiData[0];

        if (absensi.clock_out_time) {
            return res.status(400).json({
                success: false,
                message: "Anda sudah melakukan clock-out hari ini",
            });
        }

        // Simpan foto path jika ada
        let photoPath = null;
        if (req.file) {
            photoPath = req.file.path;
        }

        // Update absensi dengan data clock-out
        await query(
            `UPDATE absensi SET
                clock_out_time = ?,
                clock_out_latitude = ?,
                clock_out_longitude = ?,
                clock_out_address = ?,
                clock_out_distance = ?,
                clock_out_photo = ?,
                durasi_kerja = TIMEDIFF(?, clock_in_time)
            WHERE id = ?`,
            [
                timestamp || new Date(),
                latitude,
                longitude,
                address || "Unknown",
                distance_from_office || 0,
                photoPath,
                timestamp || new Date(),
                absensi.id,
            ],
        );

        res.status(200).json({
            success: true,
            message: "Clock-out berhasil",
            data: {
                id: absensi.id,
                clock_in: absensi.clock_in_time,
                clock_out: timestamp || new Date(),
                check_in_location: {
                    latitude: absensi.clock_in_latitude,
                    longitude: absensi.clock_in_longitude,
                    address: absensi.clock_in_address,
                },
                check_out_location: {
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    address: address || "Unknown",
                },
            },
        });
    } catch (error) {
        console.error("Error clock-out:", error);
        res.status(500).json({
            success: false,
            message: "Gagal melakukan clock-out",
            error: error.message,
        });
    }
};
