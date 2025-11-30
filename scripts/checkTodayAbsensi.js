/**
 * Script untuk debug tanggal absensi
 */

const { query } = require("../src/config/database");

async function checkTodayAbsensi() {
    try {
        console.log("🔍 Debugging tanggal absensi...\n");

        // Tanggal hari ini dari JavaScript
        const today = new Date().toISOString().split("T")[0];
        console.log("📅 Tanggal hari ini (JS):", today);

        // Ambil semua absensi
        const allAbsensi = await query(`
            SELECT 
                id, 
                user_id, 
                tanggal, 
                status,
                clock_in_time,
                DATE(tanggal) as tanggal_only
            FROM absensi 
            ORDER BY tanggal DESC 
            LIMIT 10
        `);

        console.log("\n📋 10 Record absensi terbaru:");
        allAbsensi.forEach((row) => {
            console.log(
                `  ID: ${row.id} | User: ${row.user_id} | Tanggal: ${row.tanggal} | Status: ${row.status}`,
            );
        });

        // Cek absensi hari ini
        const todayAbsensi = await query(
            "SELECT * FROM absensi WHERE DATE(tanggal) = ?",
            [today],
        );

        console.log(
            `\n✅ Absensi hari ini (${today}): ${todayAbsensi.length} record`,
        );

        if (todayAbsensi.length > 0) {
            console.log("Detail:");
            todayAbsensi.forEach((row) => {
                console.log(
                    `  User ID: ${row.user_id} | Status: ${row.status} | Clock In: ${row.clock_in_time}`,
                );
            });
        }

        // Cek juga dengan startsWith
        const todayAbsensi2 = await query(
            "SELECT * FROM absensi WHERE tanggal LIKE ?",
            [`${today}%`],
        );

        console.log(
            `\n✅ Absensi dengan LIKE '${today}%': ${todayAbsensi2.length} record`,
        );

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

checkTodayAbsensi();
