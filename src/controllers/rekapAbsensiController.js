const { query } = require("../config/database");

// GET rekap absensi dengan filter lengkap
exports.getRekapAbsensi = async (req, res) => {
    try {
        console.log("[Rekap Absensi] Request received:", req.query);

        const {
            startDate,
            endDate,
            month,
            year,
            search,
            divisi,
            departemen,
            sortBy = "tanggal",
            sortOrder = "DESC",
            page = 1,
            limit = 25,
        } = req.query;

        // Build WHERE clause
        const conditions = [];
        const params = [];

        // Filter by date range
        if (startDate && endDate) {
            conditions.push("a.tanggal BETWEEN ? AND ?");
            params.push(startDate, endDate);
        } else if (month && year) {
            // Filter by month and year
            conditions.push("MONTH(a.tanggal) = ? AND YEAR(a.tanggal) = ?");
            params.push(parseInt(month), parseInt(year));
        } else if (year) {
            // Filter by year only
            conditions.push("YEAR(a.tanggal) = ?");
            params.push(parseInt(year));
        }

        // Search by name or NIK
        if (search) {
            conditions.push("(u.name LIKE ? OR u.nik LIKE ?)");
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        // Filter by divisi (prepare for future)
        if (divisi) {
            conditions.push("u.divisi = ?");
            params.push(divisi);
        }

        // Filter by departemen (prepare for future)
        if (departemen) {
            conditions.push("u.departemen = ?");
            params.push(departemen);
        }

        const whereClause =
            conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        // Validate sortBy to prevent SQL injection
        const allowedSortFields = [
            "tanggal",
            "name",
            "nik",
            "clock_in_time",
            "clock_out_time",
            "status",
            "durasi_kerja",
        ];
        const sortField = allowedSortFields.includes(sortBy)
            ? sortBy === "name"
                ? "u.name"
                : sortBy === "nik"
                ? "u.nik"
                : `a.${sortBy}`
            : "a.tanggal";

        const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

        // Count total records
        const countQuery = `
            SELECT COUNT(*) as total
            FROM absensi a
            JOIN users u ON a.user_id = u.id
            JOIN lokasi_kantor l ON a.lokasi_id = l.id
            ${whereClause}
        `;

        const countResult = await query(countQuery, params);
        const totalRecords = countResult[0].total;

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Get paginated data
        const dataQuery = `
            SELECT 
                a.id,
                a.tanggal,
                a.clock_in_time,
                a.clock_in_latitude,
                a.clock_in_longitude,
                a.clock_in_address,
                a.clock_in_distance,
                a.clock_in_photo,
                a.clock_out_time,
                a.clock_out_latitude,
                a.clock_out_longitude,
                a.clock_out_address,
                a.clock_out_distance,
                a.clock_out_photo,
                a.durasi_kerja,
                a.status,
                a.keterangan,
                u.id as user_id,
                u.nik,
                u.name as user_name,
                u.position,
                u.email,
                u.phone,
                l.id as lokasi_id,
                l.nama_kantor,
                l.alamat as alamat_kantor,
                l.latitude as kantor_latitude,
                l.longitude as kantor_longitude
            FROM absensi a
            JOIN users u ON a.user_id = u.id
            JOIN lokasi_kantor l ON a.lokasi_id = l.id
            ${whereClause}
            ORDER BY ${sortField} ${order}
            LIMIT ? OFFSET ?
        `;

        const results = await query(dataQuery, [...params, limitNum, offset]);

        console.log(
            `[Rekap Absensi] Found ${results.length} records out of ${totalRecords} total`,
        );

        res.json({
            success: true,
            data: results,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalRecords,
                totalPages: Math.ceil(totalRecords / limitNum),
            },
        });
    } catch (error) {
        console.error("Get rekap absensi error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// GET summary statistik untuk rekap
exports.getRekapSummary = async (req, res) => {
    try {
        const { startDate, endDate, month, year } = req.query;

        const conditions = [];
        const params = [];

        if (startDate && endDate) {
            conditions.push("tanggal BETWEEN ? AND ?");
            params.push(startDate, endDate);
        } else if (month && year) {
            conditions.push("MONTH(tanggal) = ? AND YEAR(tanggal) = ?");
            params.push(parseInt(month), parseInt(year));
        } else if (year) {
            conditions.push("YEAR(tanggal) = ?");
            params.push(parseInt(year));
        }

        const whereClause =
            conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const summaryQuery = `
            SELECT 
                COUNT(*) as total_records,
                SUM(CASE WHEN status = 'hadir' THEN 1 ELSE 0 END) as total_hadir,
                SUM(CASE WHEN status = 'terlambat' THEN 1 ELSE 0 END) as total_terlambat,
                SUM(CASE WHEN status = 'pulang_cepat' THEN 1 ELSE 0 END) as total_pulang_cepat,
                SUM(CASE WHEN status = 'tidak_hadir' THEN 1 ELSE 0 END) as total_tidak_hadir
            FROM absensi
            ${whereClause}
        `;

        const result = await query(summaryQuery, params);

        res.json({
            success: true,
            data: result[0],
        });
    } catch (error) {
        console.error("Get rekap summary error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};
