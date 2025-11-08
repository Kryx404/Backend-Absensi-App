/**
 * Database Configuration
 * Konfigurasi koneksi ke MySQL database
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

// Konfigurasi connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "absensi_db",
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10, // Maksimal 10 koneksi simultan
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: "+07:00", // WIB (Indonesia)
});

// Test koneksi database
pool.getConnection()
    .then((connection) => {
        console.log("✅ Database connected successfully");
        connection.release();
    })
    .catch((err) => {
        console.error("❌ Database connection failed:", err.message);
    });

// Helper function untuk query
const query = async (sql, params = []) => {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error("Database query error:", error);
        throw error;
    }
};

// Helper function untuk transaksi
const transaction = async (callback) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    pool,
    query,
    transaction,
};
