/**
 * Database Connection Test
 * Script untuk test koneksi database dan menampilkan info
 */

require("dotenv").config();
const mysql = require("mysql2/promise");

const config = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "absensi_db",
    port: process.env.DB_PORT || 3306,
};

async function testConnection() {
    console.log("");
    console.log("🔍 Testing Database Connection...");
    console.log("");
    console.log("Configuration:");
    console.log("  Host:", config.host);
    console.log("  Port:", config.port);
    console.log("  User:", config.user);
    console.log("  Database:", config.database);
    console.log("");

    try {
        // Test connection
        const connection = await mysql.createConnection(config);
        console.log("✅ Connection successful!");
        console.log("");

        // Get database version
        const [versionRows] = await connection.execute(
            "SELECT VERSION() as version",
        );
        console.log("MySQL Version:", versionRows[0].version);
        console.log("");

        // Get table list
        const [tables] = await connection.execute(
            "SELECT TABLE_NAME, TABLE_ROWS, ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS size_mb " +
                "FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
            [config.database],
        );

        console.log("📊 Database Tables:");
        console.table(
            tables.map((t) => ({
                Table: t.TABLE_NAME,
                Rows: t.TABLE_ROWS,
                "Size (MB)": t.size_mb,
            })),
        );

        // Get sample data counts
        console.log("📈 Data Summary:");

        const [userCount] = await connection.execute(
            "SELECT COUNT(*) as count FROM users",
        );
        console.log("  Users:", userCount[0].count);

        const [lokasiCount] = await connection.execute(
            "SELECT COUNT(*) as count FROM lokasi_kantor",
        );
        console.log("  Lokasi Kantor:", lokasiCount[0].count);

        const [absensiCount] = await connection.execute(
            "SELECT COUNT(*) as count FROM absensi",
        );
        console.log("  Absensi Records:", absensiCount[0].count);

        const [izinCount] = await connection.execute(
            "SELECT COUNT(*) as count FROM izin_cuti",
        );
        console.log("  Izin/Cuti:", izinCount[0].count);

        console.log("");
        console.log("✅ All tests passed!");
        console.log("");

        await connection.end();
        process.exit(0);
    } catch (error) {
        console.log("");
        console.error("❌ Connection failed!");
        console.error("");
        console.error("Error:", error.message);
        console.error("");

        if (error.code === "ER_ACCESS_DENIED_ERROR") {
            console.error("💡 Tips:");
            console.error("  - Periksa username dan password di file .env");
            console.error("  - Pastikan user memiliki akses ke database");
            console.error("");
        } else if (error.code === "ECONNREFUSED") {
            console.error("💡 Tips:");
            console.error("  - Pastikan MySQL server sudah running");
            console.error(
                "  - Cek dengan: brew services list (Mac) atau systemctl status mysql (Linux)",
            );
            console.error("  - Start MySQL: brew services start mysql (Mac)");
            console.error("");
        } else if (error.code === "ER_BAD_DB_ERROR") {
            console.error("💡 Tips:");
            console.error("  - Database belum dibuat");
            console.error("  - Jalankan: mysql -u root -p < database.sql");
            console.error("");
        }

        process.exit(1);
    }
}

testConnection();
