import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { verifyToken } from "./utils/helpers";

// Auth routes
import { handleRegister, handleLogin, handleGetProfile, handleUpdateProfile } from "./routes/auth";

// Location routes
import {
  handleSaveLocation,
  handleGetLocations,
  handleGetLocation,
  handleDeleteLocation,
  handleCreateRoute,
  handleGetRoutes,
  handleDeleteRoute,
} from "./routes/locations";

// Tracking routes
import {
  handleStartSession,
  handleAddLocationPoint,
  handleGetActiveSession,
  handleGetSession,
  handlePauseSession,
  handleResumeSession,
  handleEndSession,
  handleGetSessions,
} from "./routes/tracking";

let dbInitialized = false;

export async function createServer() {
  const app = express();

  // Initialize database immediately
  try {
    const { initializeDatabase } = await import("./db");
    await initializeDatabase();
    dbInitialized = true;
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Optional: Auth middleware (extracts user ID from token in Authorization header)
  app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const userId = verifyToken(token);
      if (userId) {
        req.headers["x-user-id"] = userId;
      }
    }
    next();
  });

  // Health check
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // ========== AUTH ROUTES ==========
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/login", handleLogin);
  app.get("/api/auth/profile", handleGetProfile);
  app.put("/api/auth/profile", handleUpdateProfile);

  // ========== LOCATION ROUTES ==========
  app.post("/api/locations", handleSaveLocation);
  app.get("/api/locations", handleGetLocations);
  app.get("/api/locations/:id", handleGetLocation);
  app.delete("/api/locations/:id", handleDeleteLocation);

  // ========== ROUTE ROUTES ==========
  app.post("/api/routes", handleCreateRoute);
  app.get("/api/routes", handleGetRoutes);
  app.delete("/api/routes/:id", handleDeleteRoute);

  // ========== TRACKING ROUTES ==========
  app.post("/api/tracking/sessions", handleStartSession);
  app.get("/api/tracking/sessions/active", handleGetActiveSession);
  app.get("/api/tracking/sessions", handleGetSessions);
  app.get("/api/tracking/sessions/:sessionId", handleGetSession);
  app.post("/api/tracking/sessions/:sessionId/pause", handlePauseSession);
  app.post("/api/tracking/sessions/:sessionId/resume", handleResumeSession);
  app.post("/api/tracking/sessions/:sessionId/end", handleEndSession);
  app.post("/api/tracking/sessions/:sessionId/location", handleAddLocationPoint);

  return app;
}
