const { query } = require("../config/database");

// POST login
exports.login = async (req, res) => {
    try {
        const { nik, password } = req.body;

        if (!nik || !password) {
            return res.status(400).json({
                success: false,
                message: "NIK dan password harus diisi",
            });
        }

        // Cari user berdasarkan NIK dari database
        const users = await query(
            "SELECT * FROM users WHERE nik = ? AND status = ?",
            [nik, "active"],
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "NIK atau password salah",
            });
        }

        const user = users[0];

        // Cek password (untuk sementara plain text, nanti gunakan bcrypt)
        // TODO: Gunakan bcrypt.compare() untuk production
        if (user.password !== password) {
            return res.status(401).json({
                success: false,
                message: "NIK atau password salah",
            });
        }

        // Log aktivitas login
        await query(
            "INSERT INTO log_aktivitas (user_id, aktivitas, deskripsi, ip_address) VALUES (?, ?, ?, ?)",
            [user.id, "login", `User ${user.name} melakukan login`, req.ip],
        );

        // Return user data tanpa password
        const { password: _, ...userData } = user;

        res.json({
            success: true,
            message: "Login berhasil",
            data: {
                user: userData,
                token: "dummy-token-" + user.id, // TODO: Gunakan JWT untuk production
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// POST logout
exports.logout = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"] || req.body.user_id;

        // Log aktivitas logout jika ada user_id
        if (userId) {
            await query(
                "INSERT INTO log_aktivitas (user_id, aktivitas, deskripsi, ip_address) VALUES (?, ?, ?, ?)",
                [userId, "logout", "User melakukan logout", req.ip],
            );
        }

        res.json({
            success: true,
            message: "Logout berhasil",
        });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};
