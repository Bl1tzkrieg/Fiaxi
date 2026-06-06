import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import fs from "fs";
import path from "path";

const dbFile = "./fiaxi.db";
let db: SqlJsDatabase | null = null;
let sqlJs: any = null;

async function initSqlModule() {
  if (!sqlJs) {
    sqlJs = await initSqlJs();
  }
  return sqlJs;
}

async function loadDatabase() {
  const sql = await initSqlModule();

  if (fs.existsSync(dbFile)) {
    const buffer = fs.readFileSync(dbFile);
    db = new sql.Database(buffer);
  } else {
    db = new sql.Database();
  }
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbFile, buffer);
  }
}

export async function dbRun(sql: string, params: any[] = []): Promise<void> {
  if (!db) await loadDatabase();
  try {
    const stmt = db!.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
    saveDatabase();
  } catch (error) {
    console.error("DB run error:", error, "SQL:", sql);
    throw error;
  }
}

export async function dbGet(sql: string, params: any[] = []): Promise<any> {
  if (!db) await loadDatabase();
  try {
    const stmt = db!.prepare(sql);
    stmt.bind(params);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  } catch (error) {
    console.error("DB get error:", error, "SQL:", sql);
    throw error;
  }
}

export async function dbAll(sql: string, params: any[] = []): Promise<any[]> {
  if (!db) await loadDatabase();
  try {
    const stmt = db!.prepare(sql);
    stmt.bind(params);
    const results: any[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (error) {
    console.error("DB all error:", error, "SQL:", sql);
    throw error;
  }
}

export async function initializeDatabase() {
  try {
    if (!db) await loadDatabase();

    // Create tables
    const createTablesSQL = `
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
      );

      CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        address TEXT,
        location_type TEXT NOT NULL CHECK(location_type IN ('home', 'work', 'pickup', 'dropoff', 'current')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

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
      );

      CREATE TABLE IF NOT EXISTS tracking_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'completed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

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
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_locations_user ON locations(user_id);
      CREATE INDEX IF NOT EXISTS idx_routes_user ON routes(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON tracking_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_history_session ON location_history(session_id);
    `;

    // Split and execute each statement
    const statements = createTablesSQL.split(";").filter((s) => s.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        try {
          db!.run(stmt.trim());
        } catch (e: any) {
          // Ignore "already exists" errors
          if (!e.message?.includes("already exists")) {
            throw e;
          }
        }
      }
    }

    saveDatabase();
    console.log("✅ Database initialized successfully at ./fiaxi.db");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

export { db };
