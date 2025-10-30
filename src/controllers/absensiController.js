// Temporary in-memory data store (replace with database later)
let absensiRecords = [];

// GET all absensi records
exports.getAllAbsensi = (req, res) => {
  try {
    res.json({
      success: true,
      data: absensiRecords,
      count: absensiRecords.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// GET absensi by user ID
exports.getAbsensiByUser = (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const userAbsensi = absensiRecords.filter(a => a.userId === userId);
    
    res.json({
      success: true,
      data: userAbsensi,
      count: userAbsensi.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// POST check-in
exports.checkIn = (req, res) => {
  try {
    const { userId, name, location } = req.body;
    
    if (!userId || !name) {
      return res.status(400).json({
        success: false,
        message: 'User ID and name are required'
      });
    }
    
    const newAbsensi = {
      id: absensiRecords.length + 1,
      userId,
      name,
      location: location || 'Unknown',
      checkInTime: new Date().toISOString(),
      checkOutTime: null,
      date: new Date().toLocaleDateString('id-ID')
    };
    
    absensiRecords.push(newAbsensi);
    
    res.status(201).json({
      success: true,
      message: 'Check-in successful',
      data: newAbsensi
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// PUT check-out
exports.checkOut = (req, res) => {
  try {
    const absensiId = parseInt(req.params.id);
    const absensiIndex = absensiRecords.findIndex(a => a.id === absensiId);
    
    if (absensiIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Absensi record not found'
      });
    }
    
    if (absensiRecords[absensiIndex].checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out'
      });
    }
    
    absensiRecords[absensiIndex].checkOutTime = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Check-out successful',
      data: absensiRecords[absensiIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
