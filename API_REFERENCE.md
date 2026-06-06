# FIAXI API - Quick Reference

## Base URL
```
http://localhost:8080/api
```

## Authentication
All authenticated endpoints require:
```
Authorization: Bearer {token}
```

## Response Format
All endpoints return:
```json
{
  "success": true/false,
  "data": {...},
  "message": "error message if applicable"
}
```

---

## 🔐 Authentication Endpoints

### Register
```
POST /auth/register
Body: {
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "role": "driver" | "citizen" | "admin",
  "phone": "+1234567890" (optional)
}
Response: { user, token }
```

### Login
```
POST /auth/login
Body: {
  "email": "user@example.com",
  "password": "password123"
}
Response: { user, token }
```

### Get Profile
```
GET /auth/profile
Headers: Authorization: Bearer {token}
Response: { user }
```

### Update Profile
```
PUT /auth/profile
Headers: Authorization: Bearer {token}
Body: {
  "full_name": "John Doe" (optional),
  "phone": "+1234567890" (optional),
  "bio": "My bio" (optional),
  "profile_image": "url" (optional)
}
Response: { user }
```

---

## 📍 Location Endpoints

### Save Location
```
POST /locations
Headers: Authorization: Bearer {token}
Body: {
  "latitude": 40.7128,
  "longitude": -74.0060,
  "address": "Times Square" (optional),
  "location_type": "home" | "work" | "pickup" | "dropoff" | "current"
}
Response: { location }
```

### Get All Locations
```
GET /locations
Headers: Authorization: Bearer {token}
Response: { locations: [] }
```

### Get Specific Location
```
GET /locations/{id}
Headers: Authorization: Bearer {token}
Response: { location }
```

### Delete Location
```
DELETE /locations/{id}
Headers: Authorization: Bearer {token}
Response: { message }
```

---

## 🛣️ Route Endpoints

### Create Route
```
POST /routes
Headers: Authorization: Bearer {token}
Body: {
  "start_location_id": "location-id-1",
  "end_location_id": "location-id-2"
}
Response: { 
  route: {
    id, user_id, start_location_id, end_location_id,
    distance_km, estimated_duration_minutes
  }
}
```

### Get All Routes
```
GET /routes
Headers: Authorization: Bearer {token}
Response: { routes: [] }
```

### Delete Route
```
DELETE /routes/{id}
Headers: Authorization: Bearer {token}
Response: { message }
```

---

## 📡 Real-Time Tracking Endpoints

### Start Tracking Session
```
POST /tracking/sessions
Headers: Authorization: Bearer {token}
Response: { session: { id, user_id, start_time, status: 'active' } }
```

### Get Active Session
```
GET /tracking/sessions/active
Headers: Authorization: Bearer {token}
Response: { session } or null
```

### Get All Sessions
```
GET /tracking/sessions
Headers: Authorization: Bearer {token}
Response: { sessions: [] }
```

### Get Session with History
```
GET /tracking/sessions/{sessionId}
Headers: Authorization: Bearer {token}
Response: { 
  session: { ... },
  history: [ { latitude, longitude, timestamp, accuracy, speed, ... } ]
}
```

### Add Location Point to Session
```
POST /tracking/sessions/{sessionId}/location
Headers: Authorization: Bearer {token}
Body: {
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 5 (optional),
  "speed": 12.5 (optional),
  "heading": 45 (optional)
}
Response: { point }
```

### Pause Session
```
POST /tracking/sessions/{sessionId}/pause
Headers: Authorization: Bearer {token}
Response: { session: { ..., status: 'paused' } }
```

### Resume Session
```
POST /tracking/sessions/{sessionId}/resume
Headers: Authorization: Bearer {token}
Response: { session: { ..., status: 'active' } }
```

### End Session
```
POST /tracking/sessions/{sessionId}/end
Headers: Authorization: Bearer {token}
Response: { session: { ..., status: 'completed', end_time } }
```

---

## 🧪 Testing with cURL

### Register a driver
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

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "password": "password123"
  }'
```

### Save a location (use token from login response)
```bash
curl -X POST http://localhost:8080/api/locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "Times Square, NYC",
    "location_type": "work"
  }'
```

### Start tracking
```bash
curl -X POST http://localhost:8080/api/tracking/sessions \
  -H "Authorization: Bearer {token}"
```

### Add location to tracking session
```bash
curl -X POST http://localhost:8080/api/tracking/sessions/{sessionId}/location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "latitude": 40.7150,
    "longitude": -74.0050,
    "accuracy": 5,
    "speed": 12.5
  }'
```

---

## Frontend Usage

Use the API client utilities in `client/lib/api-client.ts`:

```typescript
import { authAPI, locationsAPI, trackingAPI } from '@/lib/api-client';

// Register & login
await authAPI.register(email, password, name, role);
await authAPI.login(email, password);

// Locations
await locationsAPI.save({ latitude, longitude, location_type: 'work' });
const locations = await locationsAPI.getAll();

// Tracking
const session = await trackingAPI.startSession();
await trackingAPI.addLocation(sessionId, { latitude, longitude });
await trackingAPI.endSession(sessionId);
```

---

## Data Types

### User
```typescript
{
  id: string;
  email: string;
  full_name: string;
  role: 'driver' | 'citizen' | 'admin';
  phone?: string;
  profile_image?: string;
  bio?: string;
  rating: number;
  created_at: string;
  updated_at: string;
}
```

### Location
```typescript
{
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  address?: string;
  location_type: 'home' | 'work' | 'pickup' | 'dropoff' | 'current';
  created_at: string;
}
```

### Route
```typescript
{
  id: string;
  user_id: string;
  start_location_id: string;
  end_location_id: string;
  distance_km: number;
  estimated_duration_minutes: number;
  created_at: string;
}
```

### TrackingSession
```typescript
{
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
}
```

---

## Status Codes

- **201** - Resource created
- **400** - Bad request (missing/invalid data)
- **401** - Unauthorized (invalid token)
- **404** - Not found
- **409** - Conflict (e.g., email already exists)
- **500** - Server error

---

## Next Phase Features to Implement

1. **Marketplace** - Service listings, search, filtering
2. **Ratings & Reviews** - User feedback system
3. **Notifications** - Real-time alerts
4. **Payments** - Transaction processing
5. **Insurance** - Risk calculation, policies
6. **Analytics** - Aggregated data, reports
7. **Messaging** - User-to-user communication
