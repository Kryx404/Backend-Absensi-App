// Temporary in-memory data store (replace with database later)
let absensiRecords = [];
let nextId = 1;

// GET all absensi records
exports.getAllAbsensi = (req, res) => {
    try {
        res.json({
            success: true,
            data: absensiRecords,
            count: absensiRecords.length,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// GET absensi by user ID
exports.getAbsensiByUser = (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const userAbsensi = absensiRecords.filter((a) => a.userId === userId);

        res.json({
            success: true,
            data: userAbsensi,
            count: userAbsensi.length,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// Get today's absensi for logged in user
exports.getTodayAbsensi = (req, res) => {
    try {
        // Untuk development, ambil dari header atau body
        // Nanti ganti dengan req.user.id dari JWT middleware
        const userId = req.headers['x-user-id'] || 1;

        // Get today's date (format: YYYY-MM-DD)
        const today = new Date().toLocaleDateString('id-ID');

        // Cari absensi hari ini untuk user ini
        const todayAbsensi = absensiRecords.find(
            (record) => record.userId == userId && record.date === today
        );

        if (!todayAbsensi) {
            return res.status(200).json({
                success: true,
                data: {
                    clock_in: null,
                    clock_out: null,
                },
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: todayAbsensi.id,
                clock_in: todayAbsensi.checkInTime,
                clock_out: todayAbsensi.checkOutTime,
                check_in_location: todayAbsensi.checkInLocation,
                check_out_location: todayAbsensi.checkOutLocation,
                photo_in: todayAbsensi.photoIn,
                photo_out: todayAbsensi.photoOut,
            },
        });
    } catch (error) {
        console.error("Error getting today absensi:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mendapatkan data absensi hari ini",
        });
    }
};

// POST clock-in
exports.clockIn = (req, res) => {
    try {
        // Untuk development, ambil dari header atau body
        const userId = req.headers['x-user-id'] || req.body.user_id || 1;
        const userName = req.body.user_name || 'User';
        
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

        // Get today's date
        const today = new Date().toLocaleDateString('id-ID');

        // Check apakah sudah clock-in hari ini
        const existingAbsensi = absensiRecords.find(
            (record) => record.userId == userId && record.date === today
        );

        if (existingAbsensi) {
            return res.status(400).json({
                success: false,
                message: "Anda sudah melakukan clock-in hari ini",
            });
        }

        // Simpan foto jika ada (sementara simpan path/info saja)
        let photoInfo = null;
        if (req.file) {
            photoInfo = {
                filename: req.file.filename,
                path: req.file.path,
                mimetype: req.file.mimetype,
            };
        }

        const newAbsensi = {
            id: nextId++,
            userId: userId,
            userName: userName,
            date: today,
            checkInTime: timestamp || new Date().toISOString(),
            checkInLocation: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                address: address || 'Unknown',
            },
            distanceFromOffice: parseFloat(distance_from_office) || 0,
            lokasiId: parseInt(lokasi_id),
            photoIn: photoInfo,
            checkOutTime: null,
            checkOutLocation: null,
            photoOut: null,
        };

        absensiRecords.push(newAbsensi);

        res.status(201).json({
            success: true,
            message: "Clock-in berhasil",
            data: {
                id: newAbsensi.id,
                clock_in: newAbsensi.checkInTime,
                check_in_location: newAbsensi.checkInLocation,
                distance_from_office: newAbsensi.distanceFromOffice,
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
exports.clockOut = (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.body.user_id || 1;
        
        const {
            timestamp,
            latitude,
            longitude,
            address,
            distance_from_office,
            lokasi_id,
        } = req.body;

        // Validasi input
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: "Latitude dan longitude wajib diisi",
            });
        }

        // Get today's date
        const today = new Date().toLocaleDateString('id-ID');

        // Cari absensi hari ini
        const absensiIndex = absensiRecords.findIndex(
            (record) => record.userId == userId && record.date === today
        );

        if (absensiIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Anda belum melakukan clock-in hari ini",
            });
        }

        if (absensiRecords[absensiIndex].checkOutTime) {
            return res.status(400).json({
                success: false,
                message: "Anda sudah melakukan clock-out hari ini",
            });
        }

        // Simpan foto jika ada
        let photoInfo = null;
        if (req.file) {
            photoInfo = {
                filename: req.file.filename,
                path: req.file.path,
                mimetype: req.file.mimetype,
            };
        }

        // Update record
        absensiRecords[absensiIndex].checkOutTime = timestamp || new Date().toISOString();
        absensiRecords[absensiIndex].checkOutLocation = {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            address: address || 'Unknown',
        };
        absensiRecords[absensiIndex].photoOut = photoInfo;

        res.status(200).json({
            success: true,
            message: "Clock-out berhasil",
            data: {
                id: absensiRecords[absensiIndex].id,
                clock_in: absensiRecords[absensiIndex].checkInTime,
                clock_out: absensiRecords[absensiIndex].checkOutTime,
                check_in_location: absensiRecords[absensiIndex].checkInLocation,
                check_out_location: absensiRecords[absensiIndex].checkOutLocation,
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
