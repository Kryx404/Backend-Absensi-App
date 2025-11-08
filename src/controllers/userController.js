const { query } = require("../config/database");

// GET all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await query(
            "SELECT id, nik, name, email, position, role, phone, address, status, created_at, updated_at FROM users ORDER BY name",
        );

        res.json({
            success: true,
            data: users,
            count: users.length,
        });
    } catch (error) {
        console.error("Get all users error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// GET user by ID
exports.getUserById = async (req, res) => {
    try {
        const users = await query(
            "SELECT id, nik, name, email, position, role, phone, address, status, created_at, updated_at FROM users WHERE id = ?",
            [req.params.id],
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.json({
            success: true,
            data: users[0],
        });
    } catch (error) {
        console.error("Get user by ID error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// POST create user
exports.createUser = async (req, res) => {
    try {
        const { nik, name, email, password, position, role, phone, address } =
            req.body;

        // Validasi input wajib
        if (!nik || !name || !password) {
            return res.status(400).json({
                success: false,
                message: "NIK, name, dan password wajib diisi",
            });
        }

        // Cek apakah NIK sudah ada
        const existingUser = await query("SELECT id FROM users WHERE nik = ?", [
            nik,
        ]);

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: "NIK sudah terdaftar",
            });
        }

        // Insert user baru
        const result = await query(
            `INSERT INTO users (nik, name, email, password, position, role, phone, address, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nik,
                name,
                email || null,
                password,
                position || null,
                role || "employee",
                phone || null,
                address || null,
                "active",
            ],
        );

        // Ambil data user yang baru dibuat
        const newUsers = await query(
            "SELECT id, nik, name, email, position, role, phone, address, status, created_at FROM users WHERE id = ?",
            [result.insertId],
        );

        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: newUsers[0],
        });
    } catch (error) {
        console.error("Create user error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// PUT update user
exports.updateUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { name, email, position, role, phone, address, status } =
            req.body;

        // Cek apakah user exists
        const existingUser = await query("SELECT id FROM users WHERE id = ?", [
            userId,
        ]);

        if (existingUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Update user
        await query(
            `UPDATE users SET 
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        position = COALESCE(?, position),
        role = COALESCE(?, role),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        status = COALESCE(?, status)
      WHERE id = ?`,
            [name, email, position, role, phone, address, status, userId],
        );

        // Ambil data user yang sudah diupdate
        const updatedUser = await query(
            "SELECT id, nik, name, email, position, role, phone, address, status, created_at, updated_at FROM users WHERE id = ?",
            [userId],
        );

        res.json({
            success: true,
            message: "User updated successfully",
            data: updatedUser[0],
        });
    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// DELETE user
exports.deleteUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Cek apakah user exists
        const existingUser = await query(
            "SELECT id, name FROM users WHERE id = ?",
            [userId],
        );

        if (existingUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Delete user (cascade akan menghapus data terkait)
        await query("DELETE FROM users WHERE id = ?", [userId]);

        res.json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};
