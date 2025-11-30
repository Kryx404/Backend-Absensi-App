/**
 * Script untuk update status absensi yang NULL menjadi 'hadir'
 * Jalankan dengan: node scripts/fixAbsensiStatus.js
 */

const { query } = require("../src/config/database");

async function fixAbsensiStatus() {
    try {
        console.log("Memeriksa data absensi tanpa status...");

        // Cek berapa banyak record dengan status NULL
        const nullStatus = await query(
            "SELECT COUNT(*) as count FROM absensi WHERE status IS NULL OR status = ''",
        );

        console.log(`Ditemukan ${nullStatus[0].count} record tanpa status`);

        if (nullStatus[0].count > 0) {
            // Update semua record yang status-nya NULL menjadi 'hadir'
            const result = await query(
                "UPDATE absensi SET status = 'hadir' WHERE status IS NULL OR status = ''",
            );

            console.log(`✅ Berhasil update ${result.affectedRows} record`);
        } else {
            console.log("✅ Semua record sudah punya status");
        }

        // Tampilkan summary
        const summary = await query(`
            SELECT 
                status, 
                COUNT(*) as count 
            FROM absensi 
            GROUP BY status
        `);

        console.log("\n📊 Summary status absensi:");
        summary.forEach((row) => {
            console.log(`  ${row.status}: ${row.count} record`);
        });

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

fixAbsensiStatus();
