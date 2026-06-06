# FIAXI Backend - MVP Structure

## Overview

This is the backend for the FIAXI urban mobility platform MVP. It's built with Express.js and SQLite, with a focus on two core features:
1. **User Authentication & Profiles**
2. **Geolocation & Real-time Tracking**

## Database Schema

### Tables

#### `users`
Stores user accounts with roles (driver, citizen, admin).
```sql
- id (TEXT, PRIMARY KEY)
- email (TEXT, UNIQUE)
- password_hash (TEXT)
- full_name (TEXT)
- role (TEXT: 'driver', 'citizen', 'admin')
- phone (TEXT, OPTIONAL)
- profile_image (TEXT, OPTIONAL)
- bio (TEXT, OPTIONAL)
- rating (REAL, DEFAULT 5.0)
- created_at, updated_at (TIMESTAMPS)
```

#### `locations`
Stores user-defined locations (home, work, pickup points, etc.).
```sql
- id (TEXT, PRIMARY KEY)
- user_id (TEXT, FOREIGN KEY)
- latitude, longitude (REAL)
- address (TEXT, OPTIONAL)
- location_type (TEXT: 'home', 'work', 'pickup', 'dropoff', 'current')
- created_at (TIMESTAMP)
```

#### `routes`
Pre-calculated routes between two locations with distance/duration.
```sql
- id (TEXT, PRIMARY KEY)
- user_id (TEXT, FOREIGN KEY)
- start_location_id, end_location_id (TEXT, FOREIGN KEY)
- distance_km (REAL)
- estimated_duration_minutes (INTEGER)
- route_data (TEXT, OPTIONAL - for storing detailed route info)
- created_at (TIMESTAMP)
```

#### `tracking_sessions`
Active or completed tracking sessions (recording user movement).
```sql
- id (TEXT, PRIMARY KEY)
- user_id (TEXT, FOREIGN KEY)
- start_time (DATETIME)
- end_time (DATETIME, OPTIONAL)
- status (TEXT: 'active', 'paused', 'completed')
- created_at (TIMESTAMP)
```

#### `location_history`
Individual GPS points collected during a tracking session.
```sql
- id (TEXT, PRIMARY KEY)
- session_id (TEXT, FOREIGN KEY)
- latitude, longitude (REAL)
- accuracy, speed, heading (REAL, OPTIONAL)
- timestamp (DATETIME)
```

## API Endpoints

### Authentication

**POST `/api/auth/register`**
- Register a new user
- Body: `{ email, password, full_name, role, phone? }`
- Returns: `{ user, token }`

**POST `/api/auth/login`**
- Login user
- Body: `{ email, password }`
- Returns: `{ user, token }`

**GET `/api/auth/profile`**
- Get current user profile
- Headers: `Authorization: Bearer <token>`
- Returns: `{ user }`

**PUT `/api/auth/profile`**
- Update profile
- Headers: `Authorization: Bearer <token>`
- Body: `{ full_name?, phone?, bio?, profile_image? }`
- Returns: `{ user }`

### Locations

**POST `/api/locations`**
- Save or update a location
- Body: `{ latitude, longitude, address?, location_type }`
- Returns: `{ location }`

**GET `/api/locations`**
- Get all user locations
- Returns: `{ locations: [] }`

**GET `/api/locations/:id`**
- Get specific location
- Returns: `{ location }`

**DELETE `/api/locations/:id`**
- Delete a location

### Routes

**POST `/api/routes`**
- Create a route between two locations
- Body: `{ start_location_id, end_location_id }`
- Returns: `{ route }` (includes calculated distance & duration)

**GET `/api/routes`**
- Get all user routes
- Returns: `{ routes: [] }`

**DELETE `/api/routes/:id`**
- Delete a route

### Tracking Sessions

**POST `/api/tracking/sessions`**
- Start a new tracking session
- Returns: `{ session }`

**GET `/api/tracking/sessions/active`**
- Get the currently active session (if any)
- Returns: `{ session }` or `null`

**GET `/api/tracking/sessions`**
- Get all tracking sessions
- Returns: `{ sessions: [] }`

**GET `/api/tracking/sessions/:sessionId`**
- Get session with full location history
- Returns: `{ session, history: [] }`

**POST `/api/tracking/sessions/:sessionId/location`**
- Add a location point to active session
- Body: `{ latitude, longitude, accuracy?, speed?, heading? }`
- Returns: `{ point }`

**POST `/api/tracking/sessions/:sessionId/pause`**
- Pause a tracking session

**POST `/api/tracking/sessions/:sessionId/resume`**
- Resume a paused session

**POST `/api/tracking/sessions/:sessionId/end`**
- Complete a tracking session

## Authentication

The API uses token-based authentication:
1. User registers/logs in and receives a token
2. Token is stored in localStorage (client-side)
3. For authenticated requests, include: `Authorization: Bearer <token>`
4. The server validates the token and extracts the user ID

**Note:** For MVP, we use a simple token format. For production, migrate to proper JWT.

## File Structure

```
server/
├── index.ts                  # Main server setup & route registration
├── db.ts                     # SQLite initialization & promisified methods
├── routes/
│   ├── auth.ts              # Authentication handlers
│   ├── locations.ts         # Location & route handlers
│   ├── tracking.ts          # Tracking session handlers
│   └── demo.ts              # Example endpoint
└── utils/
    └── helpers.ts           # ID generation, token utilities

client/
└── lib/
    └── api-client.ts        # Frontend API client utilities
```

## Usage Examples

### Frontend Auth Flow

```typescript
// Register
const response = await authAPI.register(
  "user@example.com",
  "password123",
  "John Doe",
  "driver"
);

// Login
await authAPI.login("user@example.com", "password123");

// Get profile
const profile = await authAPI.getProfile();

// Logout
authAPI.logout();
```

### Frontend Location Flow

```typescript
// Save a location
const loc = await locationsAPI.save({
  latitude: 40.7128,
  longitude: -74.0060,
  address: "Times Square",
  location_type: "work"
});

// Create a route
const route = await routesAPI.create(startLocationId, endLocationId);

// Get all locations
const locations = await locationsAPI.getAll();
```

### Frontend Tracking Flow

```typescript
// Start tracking
const session = await trackingAPI.startSession();

// Add GPS points (call repeatedly as position updates)
await trackingAPI.addLocation(sessionId, {
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 5,
  speed: 12.5
});

// Pause tracking
await trackingAPI.pauseSession(sessionId);

// Resume tracking
await trackingAPI.resumeSession(sessionId);

// End tracking
await trackingAPI.endSession(sessionId);

// Get session with full history
const { session, history } = await trackingAPI.getSession(sessionId);
```

## Key Features

✅ **User Management** - Registration, login, profile updates  
✅ **Role-Based Access** - Driver, citizen, admin roles  
✅ **Location Management** - Save and manage multiple locations  
✅ **Route Planning** - Calculate routes with distance/time estimates  
✅ **Real-Time Tracking** - Record GPS points with accuracy/speed  
✅ **Session Management** - Pause/resume/end tracking sessions  

## Next Steps for Full Platform

1. **Marketplace Module** - Service listings, filtering, search
2. **Ratings & Reviews** - Community feedback system
3. **Notifications** - Real-time alerts and messaging
4. **Payments** - Transaction handling and gateway integration
5. **Insurance** - Risk assessment and policy management
6. **Analytics** - Data aggregation and reporting
7. **Third-Party Integration** - Google Maps, SMS, Email gateways

## Development

Start the dev server:
```bash
pnpm dev
```

Run tests:
```bash
pnpm test
```

Database file location: `./fiaxi.db`

---

This MVP provides a solid foundation for building out additional FIAXI platform features.
