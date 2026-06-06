import { RequestHandler } from "express";
import { dbRun, dbGet, dbAll } from "../db";
import { TrackingSession, LocationHistoryInput } from "@shared/api";
import { generateId } from "../utils/helpers";

// Start a tracking session
export const handleStartSession: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const sessionId = generateId();
    const now = new Date().toISOString();

    await dbRun(
      `INSERT INTO tracking_sessions (id, user_id, start_time, status)
       VALUES (?, ?, ?, 'active')`,
      [sessionId, userId, now]
    );

    const session = await dbGet(`SELECT * FROM tracking_sessions WHERE id = ?`, [sessionId]);

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Start session error:", error);
    res.status(500).json({ success: false, message: "Failed to start session" });
  }
};

// Add location point to tracking session
export const handleAddLocationPoint: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { sessionId } = req.params;
    const { latitude, longitude, accuracy, speed, heading } = req.body as LocationHistoryInput;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: "Missing coordinates" });
    }

    // Verify session belongs to user
    const session = await dbGet(
      `SELECT id FROM tracking_sessions WHERE id = ? AND user_id = ?`,
      [sessionId, userId]
    );

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const pointId = generateId();
    const timestamp = new Date().toISOString();

    await dbRun(
      `INSERT INTO location_history (id, session_id, latitude, longitude, accuracy, speed, heading, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [pointId, sessionId, latitude, longitude, accuracy || null, speed || null, heading || null, timestamp]
    );

    const point = await dbGet(`SELECT * FROM location_history WHERE id = ?`, [pointId]);

    res.status(201).json({
      success: true,
      data: point,
    });
  } catch (error) {
    console.error("Add location point error:", error);
    res.status(500).json({ success: false, message: "Failed to add location point" });
  }
};

// Get active session
export const handleGetActiveSession: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const session = await dbGet(
      `SELECT * FROM tracking_sessions WHERE user_id = ? AND status = 'active' ORDER BY start_time DESC LIMIT 1`,
      [userId]
    );

    if (!session) {
      return res.json({
        success: true,
        data: null,
      });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Get active session error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch session" });
  }
};

// Get session with all location history
export const handleGetSession: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const session = await dbGet(
      `SELECT * FROM tracking_sessions WHERE id = ? AND user_id = ?`,
      [sessionId, userId]
    );

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const history = await dbAll(
      `SELECT * FROM location_history WHERE session_id = ? ORDER BY timestamp ASC`,
      [sessionId]
    );

    res.json({
      success: true,
      data: {
        session,
        history: history || [],
      },
    });
  } catch (error) {
    console.error("Get session error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch session" });
  }
};

// Pause session
export const handlePauseSession: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const session = await dbGet(
      `SELECT id FROM tracking_sessions WHERE id = ? AND user_id = ?`,
      [sessionId, userId]
    );

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    await dbRun(
      `UPDATE tracking_sessions SET status = 'paused' WHERE id = ?`,
      [sessionId]
    );

    const updated = await dbGet(`SELECT * FROM tracking_sessions WHERE id = ?`, [sessionId]);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Pause session error:", error);
    res.status(500).json({ success: false, message: "Failed to pause session" });
  }
};

// Resume session
export const handleResumeSession: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const session = await dbGet(
      `SELECT id FROM tracking_sessions WHERE id = ? AND user_id = ?`,
      [sessionId, userId]
    );

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    await dbRun(
      `UPDATE tracking_sessions SET status = 'active' WHERE id = ?`,
      [sessionId]
    );

    const updated = await dbGet(`SELECT * FROM tracking_sessions WHERE id = ?`, [sessionId]);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Resume session error:", error);
    res.status(500).json({ success: false, message: "Failed to resume session" });
  }
};

// End session
export const handleEndSession: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const session = await dbGet(
      `SELECT id FROM tracking_sessions WHERE id = ? AND user_id = ?`,
      [sessionId, userId]
    );

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const now = new Date().toISOString();

    await dbRun(
      `UPDATE tracking_sessions SET status = 'completed', end_time = ? WHERE id = ?`,
      [now, sessionId]
    );

    const updated = await dbGet(`SELECT * FROM tracking_sessions WHERE id = ?`, [sessionId]);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("End session error:", error);
    res.status(500).json({ success: false, message: "Failed to end session" });
  }
};

// Get all sessions for user
export const handleGetSessions: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const sessions = await dbAll(
      `SELECT * FROM tracking_sessions WHERE user_id = ? ORDER BY start_time DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: sessions || [],
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch sessions" });
  }
};
