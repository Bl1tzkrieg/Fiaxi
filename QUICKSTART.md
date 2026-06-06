# FIAXI MVP - Quick Start Guide

## 🚀 Start the App

```bash
pnpm dev
```

This starts both:
- **Frontend**: React SPA on http://localhost:8080
- **Backend**: Express API on http://localhost:8080/api

## 📖 Documentation

1. **`IMPLEMENTATION_SUMMARY.md`** - Overview of what's been built
2. **`API_REFERENCE.md`** - Complete API endpoint reference with cURL examples
3. **`BACKEND_STRUCTURE.md`** - Database schema and architecture details

## 🔧 Quick API Test

### 1. Register a User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "password": "password123",
    "full_name": "John Driver",
    "role": "driver",
    "phone": "+1234567890"
  }'
```

Save the `token` from the response.

### 2. Create a Location
```bash
curl -X POST http://localhost:8080/api/locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "Times Square, NYC",
    "location_type": "work"
  }'
```

### 3. Start Tracking
```bash
curl -X POST http://localhost:8080/api/tracking/sessions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Save the `id` from the response.

### 4. Add GPS Points
```bash
curl -X POST http://localhost:8080/api/tracking/sessions/SESSION_ID_HERE/location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "latitude": 40.7150,
    "longitude": -74.0050,
    "accuracy": 5,
    "speed": 12.5
  }'
```

## 💻 Frontend Integration

Use the pre-built API client in your React components:

```typescript
import { authAPI, locationsAPI, trackingAPI } from '@/lib/api-client';

// Register
await authAPI.register(
  "driver@example.com",
  "password123",
  "John Driver",
  "driver"
);

// Save location
const location = await locationsAPI.save({
  latitude: 40.7128,
  longitude: -74.0060,
  location_type: 'work'
});

// Start tracking
const session = await trackingAPI.startSession();

// Add GPS point
await trackingAPI.addLocation(session.id, {
  latitude: 40.7150,
  longitude: -74.0050
});

// End tracking
await trackingAPI.endSession(session.id);
```

## 📊 API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/locations` | Save location |
| GET | `/api/locations` | Get all locations |
| GET | `/api/locations/:id` | Get specific location |
| DELETE | `/api/locations/:id` | Delete location |
| POST | `/api/routes` | Create route |
| GET | `/api/routes` | Get all routes |
| DELETE | `/api/routes/:id` | Delete route |
| POST | `/api/tracking/sessions` | Start tracking |
| GET | `/api/tracking/sessions/active` | Get active session |
| GET | `/api/tracking/sessions` | Get all sessions |
| GET | `/api/tracking/sessions/:id` | Get session + history |
| POST | `/api/tracking/sessions/:id/location` | Add GPS point |
| POST | `/api/tracking/sessions/:id/pause` | Pause tracking |
| POST | `/api/tracking/sessions/:id/resume` | Resume tracking |
| POST | `/api/tracking/sessions/:id/end` | End tracking |

## 🗂️ Project Structure

```
.
├── server/                    # Backend (Express + SQLite)
│   ├── index.ts              # Main server & routes
│   ├── db.ts                 # Database setup
│   ├── routes/               # API handlers
│   │   ├── auth.ts
│   │   ├── locations.ts
│   │   ├── tracking.ts
│   │   └── demo.ts
│   └── utils/
│       └── helpers.ts        # Utilities
├── client/                    # Frontend (React + Vite)
│   ├── pages/                # Page components
│   ├── components/           # React components
│   ├── lib/
│   │   └── api-client.ts     # API utilities
│   └── global.css            # Tailwind styles
├── shared/                    # Shared types
│   └── api.ts                # TypeScript interfaces
└── docs/
    ├── IMPLEMENTATION_SUMMARY.md
    ├── API_REFERENCE.md
    ├── BACKEND_STRUCTURE.md
    └── QUICKSTART.md (this file)
```

## 🔐 Authentication

The system uses token-based authentication:

1. **Register/Login** → receive `token`
2. **Store token** in localStorage
3. **Send token** in `Authorization: Bearer {token}` header
4. **Server validates** and extracts user ID

All authenticated endpoints require the token header.

## 🗄️ Database

- **File**: `./fiaxi.db` (created on first request)
- **Tables**: users, locations, routes, tracking_sessions, location_history
- **Type**: SQLite 3 with better-sqlite3

## 📝 Next Steps

1. **Build Frontend Pages**
   - Dashboard (user profile, stats)
   - Map view (Google Maps integration)
   - Tracking UI (real-time updates)
   - Location manager

2. **Extend Backend**
   - Marketplace (Phase 2)
   - Ratings & reviews
   - Notifications
   - Payments

3. **Testing**
   - Write unit tests
   - API integration tests
   - Load testing for tracking

4. **Deployment**
   - Connect to production database
   - Deploy to Netlify/Vercel
   - Configure environment variables

## 🆘 Troubleshooting

### Port 8080 already in use?
```bash
# Kill process on port 8080
lsof -i :8080
kill -9 <PID>

# Or use different port
PORT=3000 pnpm dev
```

### Database locked?
Delete `./fiaxi.db` and restart:
```bash
rm fiaxi.db
pnpm dev
```

### API returns 401 Unauthorized?
Make sure you're sending the correct token in the Authorization header:
```
Authorization: Bearer <token_from_register_or_login>
```

## 📚 Further Reading

- See `API_REFERENCE.md` for detailed endpoint documentation
- See `BACKEND_STRUCTURE.md` for database schema details
- See `IMPLEMENTATION_SUMMARY.md` for architecture overview

---

**You're all set! Start building the frontend.** 🎉
