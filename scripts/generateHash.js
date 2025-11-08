/**
 * Password Hash Generator
 * Script untuk generate password hash menggunakan bcrypt
 *
 * Usage:
 * node scripts/generateHash.js password123
 */

const bcrypt = require("bcrypt");

const password = process.argv[2];

if (!password) {
    console.log("❌ Error: Password tidak diberikan");
    console.log("");
    console.log("Usage:");
    console.log("  node scripts/generateHash.js <password>");
    console.log("");
    console.log("Contoh:");
    console.log("  node scripts/generateHash.js 123456");
    process.exit(1);
}

const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error("❌ Error generating hash:", err);
        process.exit(1);
    }

    console.log("");
    console.log("✅ Password Hash berhasil di-generate!");
    console.log("");
    console.log("Password:", password);
    console.log("Hash:", hash);
    console.log("");
    console.log("Copy hash di atas untuk digunakan di database:");
    console.log("");
    console.log(
        `UPDATE users SET password = '${hash}' WHERE nik = 'NIK_ANDA';`,
    );
    console.log("");
});
