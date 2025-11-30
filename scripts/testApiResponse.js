/**
 * Script untuk test response API absensi
 */

const { query } = require("../src/config/database");

async function testApiResponse() {
    try {
        console.log("🧪 Testing API Response...\n");

        // Simulasi getAllAbsensi endpoint
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

        console.log("📦 Response yang akan dikirim ke frontend:");
        console.log(
            JSON.stringify(
                {
                    success: true,
                    data: results,
                    count: results.length,
                },
                null,
                2,
            ),
        );

        console.log("\n📋 Detail 2 record terbaru:");
        results.slice(0, 2).forEach((row) => {
            console.log(`\n  ID: ${row.id}`);
            console.log(`  User ID: ${row.user_id} (${typeof row.user_id})`);
            console.log(`  Tanggal: ${row.tanggal} (${typeof row.tanggal})`);
            console.log(`  Status: ${row.status} (${typeof row.status})`);
            console.log(`  Clock In: ${row.clock_in_time}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

testApiResponse();
