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

        console.log("Update user request:", {
            userId,
            body: req.body,
        });

        // Cek apakah user exists
        const existingUser = await query("SELECT * FROM users WHERE id = ?", [
            userId,
        ]);

        if (existingUser.length === 0) {
            console.log("User not found:", userId);
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Build update query dinamis - hanya update field yang dikirim
        const updateFields = [];
        const updateValues = [];

        if (name !== undefined && name !== null && name !== "") {
            updateFields.push("name = ?");
            updateValues.push(name);
        }
        if (email !== undefined && email !== null) {
            updateFields.push("email = ?");
            updateValues.push(email);
        }
        if (position !== undefined && position !== null) {
            updateFields.push("position = ?");
            updateValues.push(position);
        }
        if (role !== undefined && role !== null) {
            updateFields.push("role = ?");
            updateValues.push(role);
        }
        if (phone !== undefined && phone !== null) {
            updateFields.push("phone = ?");
            updateValues.push(phone);
        }
        if (address !== undefined && address !== null) {
            updateFields.push("address = ?");
            updateValues.push(address);
        }
        if (status !== undefined && status !== null) {
            updateFields.push("status = ?");
            updateValues.push(status);
        }

        // Jika tidak ada field yang diupdate
        if (updateFields.length === 0) {
            return res.json({
                success: true,
                message: "No fields to update",
                data: existingUser[0],
            });
        }

        // Update user
        updateValues.push(userId);
        const updateQuery = `UPDATE users SET ${updateFields.join(
            ", ",
        )} WHERE id = ?`;

        console.log("Update query:", updateQuery);
        console.log("Update values:", updateValues);

        await query(updateQuery, updateValues);

        // Ambil data user yang sudah diupdate
        const updatedUser = await query(
            "SELECT id, nik, name, email, position, role, phone, address, status, created_at, updated_at FROM users WHERE id = ?",
            [userId],
        );

        console.log("User updated successfully:", updatedUser[0]);

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
