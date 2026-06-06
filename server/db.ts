import Database from "better-sqlite3";

const dbFile = "./fiaxi.db";
const db = new Database(dbFile);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Wrapper functions to match the async interface
export async function dbRun(sql: string, params: any[] = []): Promise<void> {
  try {
    const stmt = db.prepare(sql);
    stmt.run(...params);
  } catch (error) {
    console.error("DB run error:", error, "SQL:", sql);
    throw error;
  }
}

export async function dbGet(sql: string, params: any[] = []): Promise<any> {
  try {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  } catch (error) {
    console.error("DB get error:", error, "SQL:", sql);
    throw error;
  }
}

export async function dbAll(sql: string, params: any[] = []): Promise<any[]> {
  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } catch (error) {
    console.error("DB all error:", error, "SQL:", sql);
    throw error;
  }
}

export async function initializeDatabase() {
  try {
    // Users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('driver', 'citizen', 'admin')),
        phone TEXT,
        profile_image TEXT,
        bio TEXT,
        rating REAL DEFAULT 5.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Locations/Routes table
    db.exec(`
      CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        address TEXT,
        location_type TEXT NOT NULL CHECK(location_type IN ('home', 'work', 'pickup', 'dropoff', 'current')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Routes table
    db.exec(`
      CREATE TABLE IF NOT EXISTS routes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        start_location_id TEXT NOT NULL,
        end_location_id TEXT NOT NULL,
        distance_km REAL,
        estimated_duration_minutes INTEGER,
        route_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (start_location_id) REFERENCES locations(id),
        FOREIGN KEY (end_location_id) REFERENCES locations(id)
      )
    `);

    // Tracking sessions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS tracking_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'completed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Location history table (for tracking points)
    db.exec(`
      CREATE TABLE IF NOT EXISTS location_history (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        accuracy REAL,
        speed REAL,
        heading REAL,
        timestamp DATETIME NOT NULL,
        FOREIGN KEY (session_id) REFERENCES tracking_sessions(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_locations_user ON locations(user_id);
      CREATE INDEX IF NOT EXISTS idx_routes_user ON routes(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON tracking_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_history_session ON location_history(session_id);
    `);

    console.log("✅ Database initialized successfully at ./fiaxi.db");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

export { db };
