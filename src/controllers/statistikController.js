const { query } = require("../config/database");

// GET statistik absensi untuk grafik
exports.getStatistikAbsensi = async (req, res) => {
    try {
        console.log("[Statistik] Request received:", req.query);

        const {
            startDate,
            endDate,
            month,
            year,
            divisi,
            departemen,
            groupBy = "day", // day, month, employee
        } = req.query;

        // Build WHERE clause
        const conditions = [];
        const params = [];

        // Filter by date range
        if (startDate && endDate) {
            conditions.push("a.tanggal BETWEEN ? AND ?");
            params.push(startDate, endDate);
        } else if (month && year) {
            conditions.push("MONTH(a.tanggal) = ? AND YEAR(a.tanggal) = ?");
            params.push(parseInt(month), parseInt(year));
        } else if (year) {
            conditions.push("YEAR(a.tanggal) = ?");
            params.push(parseInt(year));
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

        // Query based on groupBy parameter
        let statistikQuery = "";

        if (groupBy === "day") {
            // Group by day - for trend charts
            statistikQuery = `
                SELECT 
                    a.tanggal,
                    DATE_FORMAT(a.tanggal, '%Y-%m-%d') as date_formatted,
                    SUM(CASE WHEN a.status = 'hadir' THEN 1 ELSE 0 END) as hadir,
                    SUM(CASE WHEN a.status = 'terlambat' THEN 1 ELSE 0 END) as terlambat,
                    SUM(CASE WHEN a.status = 'pulang_cepat' THEN 1 ELSE 0 END) as pulang_cepat,
                    SUM(CASE WHEN a.status = 'tidak_hadir' THEN 1 ELSE 0 END) as tidak_hadir,
                    COUNT(*) as total
                FROM absensi a
                JOIN users u ON a.user_id = u.id
                ${whereClause}
                GROUP BY a.tanggal
                ORDER BY a.tanggal ASC
            `;
        } else if (groupBy === "month") {
            // Group by month
            statistikQuery = `
                SELECT 
                    YEAR(a.tanggal) as year,
                    MONTH(a.tanggal) as month,
                    DATE_FORMAT(a.tanggal, '%Y-%m') as month_formatted,
                    SUM(CASE WHEN a.status = 'hadir' THEN 1 ELSE 0 END) as hadir,
                    SUM(CASE WHEN a.status = 'terlambat' THEN 1 ELSE 0 END) as terlambat,
                    SUM(CASE WHEN a.status = 'pulang_cepat' THEN 1 ELSE 0 END) as pulang_cepat,
                    SUM(CASE WHEN a.status = 'tidak_hadir' THEN 1 ELSE 0 END) as tidak_hadir,
                    COUNT(*) as total
                FROM absensi a
                JOIN users u ON a.user_id = u.id
                ${whereClause}
                GROUP BY YEAR(a.tanggal), MONTH(a.tanggal)
                ORDER BY YEAR(a.tanggal) ASC, MONTH(a.tanggal) ASC
            `;
        } else if (groupBy === "employee") {
            // Group by employee - for comparison charts
            statistikQuery = `
                SELECT 
                    u.id as user_id,
                    u.nik,
                    u.name as user_name,
                    u.position,
                    SUM(CASE WHEN a.status = 'hadir' THEN 1 ELSE 0 END) as hadir,
                    SUM(CASE WHEN a.status = 'terlambat' THEN 1 ELSE 0 END) as terlambat,
                    SUM(CASE WHEN a.status = 'pulang_cepat' THEN 1 ELSE 0 END) as pulang_cepat,
                    SUM(CASE WHEN a.status = 'tidak_hadir' THEN 1 ELSE 0 END) as tidak_hadir,
                    COUNT(*) as total,
                    ROUND((SUM(CASE WHEN a.status = 'hadir' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as persentase_hadir
                FROM absensi a
                JOIN users u ON a.user_id = u.id
                ${whereClause}
                GROUP BY u.id, u.nik, u.name, u.position
                ORDER BY persentase_hadir DESC
                LIMIT 10
            `;
        }

        const results = await query(statistikQuery, params);

        // Get summary statistics
        const summaryQuery = `
            SELECT 
                COUNT(DISTINCT a.user_id) as total_karyawan,
                COUNT(*) as total_records,
                SUM(CASE WHEN a.status = 'hadir' THEN 1 ELSE 0 END) as total_hadir,
                SUM(CASE WHEN a.status = 'terlambat' THEN 1 ELSE 0 END) as total_terlambat,
                SUM(CASE WHEN a.status = 'pulang_cepat' THEN 1 ELSE 0 END) as total_pulang_cepat,
                SUM(CASE WHEN a.status = 'tidak_hadir' THEN 1 ELSE 0 END) as total_tidak_hadir,
                ROUND((SUM(CASE WHEN a.status = 'hadir' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as avg_kehadiran,
                AVG(TIME_TO_SEC(a.durasi_kerja)) as avg_durasi_detik
            FROM absensi a
            JOIN users u ON a.user_id = u.id
            ${whereClause}
        `;

        const summaryResult = await query(summaryQuery, params);
        const summary = summaryResult[0];

        // Convert avg durasi from seconds to HH:MM:SS
        if (summary.avg_durasi_detik) {
            const hours = Math.floor(summary.avg_durasi_detik / 3600);
            const minutes = Math.floor((summary.avg_durasi_detik % 3600) / 60);
            summary.avg_durasi = `${hours}:${minutes
                .toString()
                .padStart(2, "0")}`;
        } else {
            summary.avg_durasi = "00:00";
        }
        delete summary.avg_durasi_detik;

        console.log(
            `[Statistik] Found ${results.length} records, groupBy: ${groupBy}`,
        );

        res.json({
            success: true,
            data: results,
            summary: summary,
            groupBy: groupBy,
        });
    } catch (error) {
        console.error("Get statistik error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// GET status distribution untuk pie chart
exports.getStatusDistribution = async (req, res) => {
    try {
        const { startDate, endDate, month, year, divisi, departemen } =
            req.query;

        const conditions = [];
        const params = [];

        if (startDate && endDate) {
            conditions.push("a.tanggal BETWEEN ? AND ?");
            params.push(startDate, endDate);
        } else if (month && year) {
            conditions.push("MONTH(a.tanggal) = ? AND YEAR(a.tanggal) = ?");
            params.push(parseInt(month), parseInt(year));
        } else if (year) {
            conditions.push("YEAR(a.tanggal) = ?");
            params.push(parseInt(year));
        }

        if (divisi) {
            conditions.push("u.divisi = ?");
            params.push(divisi);
        }

        if (departemen) {
            conditions.push("u.departemen = ?");
            params.push(departemen);
        }

        const whereClause =
            conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        // Get total count first
        const totalQuery = `
            SELECT COUNT(*) as total
            FROM absensi a
            JOIN users u ON a.user_id = u.id
            ${whereClause}
        `;

        const totalResult = await query(totalQuery, params);
        const totalCount = totalResult[0].total;

        // Get distribution
        const distributionQuery = `
            SELECT 
                a.status,
                COUNT(*) as count
            FROM absensi a
            JOIN users u ON a.user_id = u.id
            ${whereClause}
            GROUP BY a.status
            ORDER BY count DESC
        `;

        const results = await query(distributionQuery, params);

        // Calculate percentage manually
        const resultsWithPercentage = results.map((row) => ({
            ...row,
            percentage:
                totalCount > 0
                    ? parseFloat(((row.count / totalCount) * 100).toFixed(2))
                    : 0,
        }));

        res.json({
            success: true,
            data: resultsWithPercentage,
        });
    } catch (error) {
        console.error("Get status distribution error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};
