# Backend Absensi API

Backend API untuk sistem absensi menggunakan Express.js

## Fitur

- ✅ RESTful API
- ✅ CORS enabled
- ✅ Security headers (Helmet)
- ✅ Request logging (Morgan)
- ✅ Error handling
- ✅ Environment variables

## Struktur Folder

```
backend-absensi/
├── src/
│   ├── config/         # Konfigurasi aplikasi
│   ├── controllers/    # Business logic
│   ├── middleware/     # Custom middleware
│   ├── models/         # Data models (untuk database)
│   ├── routes/         # Route definitions
│   └── index.js        # Entry point
├── public/             # Static files
├── .env                # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## Instalasi

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables:
```bash
cp .env.example .env
```

3. Jalankan server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Absensi

- `GET /api/absensi` - Get all absensi records
- `GET /api/absensi/user/:userId` - Get absensi by user
- `POST /api/absensi/checkin` - Check-in
- `PUT /api/absensi/checkout/:id` - Check-out

## Contoh Request

### Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","role":"employee"}'
```

### Check-in
```bash
curl -X POST http://localhost:3000/api/absensi/checkin \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"name":"John Doe","location":"Office"}'
```

## Development

Server akan berjalan di `http://localhost:3000`

Untuk mengubah port, edit file `.env`:
```
PORT=3000
```

## Next Steps

- [ ] Tambahkan database (MySQL/PostgreSQL/MongoDB)
- [ ] Implementasi authentication & authorization (JWT)
- [ ] Validasi input dengan express-validator
- [ ] Upload gambar untuk foto absensi
- [ ] Dokumentasi API dengan Swagger
- [ ] Unit testing
