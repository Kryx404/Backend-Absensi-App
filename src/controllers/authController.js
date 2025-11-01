// Temporary user data (replace with database later)
const users = [
  { id: 1, nik: '12345', password: '123456', name: 'Abang fery', position: 'Hrd' },
  { id: 2, nik: '67890', password: '123456', name: 'Prof Abah', position: 'Manager' }
];

// POST login
exports.login = (req, res) => {
  try {
    const { nik, password } = req.body;
    
    if (!nik || !password) {
      return res.status(400).json({
        success: false,
        message: 'NIK dan password harus diisi'
      });
    }
    
    // Find user by NIK
    const user = users.find(u => u.nik === nik);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'NIK atau password salah'
      });
    }
    
    // Check password
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'NIK atau password salah'
      });
    }
    
    // Return user data without password
    const { password: _, ...userData } = user;
    
    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: userData,
        token: 'dummy-token-' + user.id // In production, use JWT
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// POST logout
exports.logout = (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout berhasil'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
