const { query } = require("../config/database");

// GET realtime attendance status for today
exports.getRealtimeStatus = async (req, res) => {
    try {
        console.log("[Realtime Status] Request received:", req.query);

        const {
            search,
            divisi,
            departemen,
            position,
            sortBy = "name",
            sortOrder = "ASC",
        } = req.query;

        // Get today's date in local timezone (not UTC)
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const todayStr = `${year}-${month}-${day}`; // YYYY-MM-DD in local timezone

        console.log("[Realtime Status] Today date:", todayStr);

        // Build WHERE clause for user filters
        const userConditions = ["u.status = 'active'"]; // Only active employees
        const userParams = [];

        if (search) {
            userConditions.push("(u.name LIKE ? OR u.nik LIKE ?)");
            const searchTerm = `%${search}%`;
            userParams.push(searchTerm, searchTerm);
        }

        if (divisi) {
            userConditions.push("u.divisi = ?");
            userParams.push(divisi);
        }

        if (departemen) {
            userConditions.push("u.departemen = ?");
            userParams.push(departemen);
        }

        if (position) {
            userConditions.push("u.position LIKE ?");
            userParams.push(`%${position}%`);
        }

        const userWhereClause = `WHERE ${userConditions.join(" AND ")}`;

        // Validate sortBy
        const allowedSortFields = [
            "name",
            "nik",
            "position",
            "clock_in_time",
            "status",
        ];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : "name";
        const order = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

        // Map sortField to actual column
        const sortColumnMap = {
            name: "u.name",
            nik: "u.nik",
            position: "u.position",
            clock_in_time: "COALESCE(a.clock_in_time, '23:59:59')",
            status: "COALESCE(a.status, 'zzz')",
        };
        const sortColumn = sortColumnMap[sortField] || "u.name";

        // Get all active users with their attendance status today
        const realtimeQuery = `
            SELECT 
                u.id as user_id,
                u.nik,
                u.name,
                u.position,
                u.email,
                u.phone,
                a.id as absensi_id,
                a.tanggal,
                a.clock_in_time,
                a.clock_out_time,
                a.clock_in_photo,
                a.clock_in_address,
                a.clock_in_distance,
                a.status,
                a.keterangan,
                l.nama_kantor,
                CASE 
                    WHEN a.id IS NULL THEN 'belum_absen'
                    ELSE a.status
                END as current_status
            FROM users u
            LEFT JOIN absensi a ON u.id = a.user_id AND DATE(a.tanggal) = ?
            LEFT JOIN lokasi_kantor l ON a.lokasi_id = l.id
            ${userWhereClause}
            ORDER BY ${sortColumn} ${order}
        `;

        console.log("[Realtime Status] Query params:", [
            todayStr,
            ...userParams,
        ]);
        const results = await query(realtimeQuery, [todayStr, ...userParams]);

        // Calculate summary
        const totalKaryawan = results.length;
        const sudahAbsen = results.filter((r) => r.absensi_id !== null).length;
        const belumAbsen = totalKaryawan - sudahAbsen;
        const hadir = results.filter((r) => r.status === "hadir").length;
        const terlambat = results.filter(
            (r) => r.status === "terlambat",
        ).length;
        const persentaseKehadiran =
            totalKaryawan > 0
                ? parseFloat(((sudahAbsen / totalKaryawan) * 100).toFixed(2))
                : 0;

        console.log(
            `[Realtime Status] Found ${results.length} employees, ${sudahAbsen} checked-in`,
        );

        res.json({
            success: true,
            data: results,
            summary: {
                total_karyawan: totalKaryawan,
                sudah_absen: sudahAbsen,
                belum_absen: belumAbsen,
                hadir: hadir,
                terlambat: terlambat,
                persentase_kehadiran: persentaseKehadiran,
            },
            tanggal: todayStr,
        });
    } catch (error) {
        console.error("Get realtime status error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};
