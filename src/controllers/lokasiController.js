// In-memory storage untuk lokasi kantor
let lokasiKantor = [
    {
        id: 1,
        namaKantor: "Kantor Pusat",
        alamat: "Jl. Sudirman No. 123, Jakarta",
        latitude: -6.2088,
        longitude: 106.8456,
        radius: 100, // radius dalam meter untuk validasi absensi
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

let nextId = 2;

// GET all lokasi kantor
const getAllLokasi = (req, res) => {
    res.json({
        success: true,
        message: "Data lokasi kantor berhasil diambil",
        data: lokasiKantor,
    });
};

// GET single lokasi by ID
const getLokasiById = (req, res) => {
    const { id } = req.params;
    const lokasi = lokasiKantor.find((l) => l.id === parseInt(id));

    if (!lokasi) {
        return res.status(404).json({
            success: false,
            message: "Lokasi kantor tidak ditemukan",
        });
    }

    res.json({
        success: true,
        message: "Data lokasi kantor berhasil diambil",
        data: lokasi,
    });
};

// POST create lokasi kantor
const createLokasi = (req, res) => {
    const { namaKantor, alamat, latitude, longitude, radius } = req.body;

    // Validasi input
    if (
        !namaKantor ||
        !alamat ||
        latitude === undefined ||
        longitude === undefined
    ) {
        return res.status(400).json({
            success: false,
            message: "Nama kantor, alamat, latitude, dan longitude wajib diisi",
        });
    }

    // Validasi tipe data
    if (typeof latitude !== "number" || typeof longitude !== "number") {
        return res.status(400).json({
            success: false,
            message: "Latitude dan longitude harus berupa angka",
        });
    }

    // Validasi range latitude dan longitude
    if (
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Latitude harus antara -90 sampai 90, longitude antara -180 sampai 180",
        });
    }

    const newLokasi = {
        id: nextId++,
        namaKantor,
        alamat,
        latitude,
        longitude,
        radius: radius || 100, // default 100 meter
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    lokasiKantor.push(newLokasi);

    res.status(201).json({
        success: true,
        message: "Lokasi kantor berhasil ditambahkan",
        data: newLokasi,
    });
};

// PUT update lokasi kantor
const updateLokasi = (req, res) => {
    const { id } = req.params;
    const { namaKantor, alamat, latitude, longitude, radius } = req.body;

    const index = lokasiKantor.findIndex((l) => l.id === parseInt(id));

    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: "Lokasi kantor tidak ditemukan",
        });
    }

    // Validasi tipe data jika latitude/longitude diubah
    if (latitude !== undefined && typeof latitude !== "number") {
        return res.status(400).json({
            success: false,
            message: "Latitude harus berupa angka",
        });
    }

    if (longitude !== undefined && typeof longitude !== "number") {
        return res.status(400).json({
            success: false,
            message: "Longitude harus berupa angka",
        });
    }

    // Validasi range jika latitude/longitude diubah
    if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
        return res.status(400).json({
            success: false,
            message: "Latitude harus antara -90 sampai 90",
        });
    }

    if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
        return res.status(400).json({
            success: false,
            message: "Longitude harus antara -180 sampai 180",
        });
    }

    // Update data
    lokasiKantor[index] = {
        ...lokasiKantor[index],
        namaKantor: namaKantor || lokasiKantor[index].namaKantor,
        alamat: alamat || lokasiKantor[index].alamat,
        latitude:
            latitude !== undefined ? latitude : lokasiKantor[index].latitude,
        longitude:
            longitude !== undefined ? longitude : lokasiKantor[index].longitude,
        radius: radius !== undefined ? radius : lokasiKantor[index].radius,
        updatedAt: new Date().toISOString(),
    };

    res.json({
        success: true,
        message: "Lokasi kantor berhasil diupdate",
        data: lokasiKantor[index],
    });
};

// DELETE lokasi kantor
const deleteLokasi = (req, res) => {
    const { id } = req.params;
    const index = lokasiKantor.findIndex((l) => l.id === parseInt(id));

    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: "Lokasi kantor tidak ditemukan",
        });
    }

    const deletedLokasi = lokasiKantor.splice(index, 1)[0];

    res.json({
        success: true,
        message: "Lokasi kantor berhasil dihapus",
        data: deletedLokasi,
    });
};

// GET lokasi terdekat berdasarkan koordinat user
const getLokasiTerdekat = (req, res) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
        return res.status(400).json({
            success: false,
            message: "Latitude dan longitude wajib diisi",
        });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    if (isNaN(userLat) || isNaN(userLon)) {
        return res.status(400).json({
            success: false,
            message: "Latitude dan longitude harus berupa angka",
        });
    }

    // Hitung jarak menggunakan Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // Radius bumi dalam meter
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Jarak dalam meter
    };

    // Hitung jarak untuk setiap lokasi
    const lokasiWithDistance = lokasiKantor.map((lokasi) => ({
        ...lokasi,
        jarakDariUser: Math.round(
            calculateDistance(
                userLat,
                userLon,
                lokasi.latitude,
                lokasi.longitude,
            ),
        ),
    }));

    // Urutkan berdasarkan jarak terdekat
    lokasiWithDistance.sort((a, b) => a.jarakDariUser - b.jarakDariUser);

    res.json({
        success: true,
        message: "Data lokasi kantor terdekat berhasil diambil",
        data: lokasiWithDistance,
    });
};

module.exports = {
    getAllLokasi,
    getLokasiById,
    createLokasi,
    updateLokasi,
    deleteLokasi,
    getLokasiTerdekat,
};
