import { RequestHandler } from "express";
import { dbRun, dbGet, dbAll } from "../db";
import { Location, LocationInput, Route, RouteInput } from "@shared/api";
import { generateId } from "../utils/helpers";

// Save/update a user location
export const handleSaveLocation: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { latitude, longitude, address, location_type } = req.body as LocationInput;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!latitude || !longitude || !location_type) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Check if location of this type exists
    const existing = await dbGet(
      `SELECT id FROM locations WHERE user_id = ? AND location_type = ?`,
      [userId, location_type]
    );

    let location: Location;

    if (existing) {
      // Update existing location
      await dbRun(
        `UPDATE locations SET latitude = ?, longitude = ?, address = ? WHERE id = ?`,
        [latitude, longitude, address || null, existing.id]
      );
      location = await dbGet(`SELECT * FROM locations WHERE id = ?`, [existing.id]);
    } else {
      // Create new location
      const locationId = generateId();
      await dbRun(
        `INSERT INTO locations (id, user_id, latitude, longitude, address, location_type)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [locationId, userId, latitude, longitude, address || null, location_type]
      );
      location = await dbGet(`SELECT * FROM locations WHERE id = ?`, [locationId]);
    }

    res.json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error("Save location error:", error);
    res.status(500).json({ success: false, message: "Failed to save location" });
  }
};

// Get all user locations
export const handleGetLocations: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const locations = await dbAll(
      `SELECT id, user_id, latitude, longitude, address, location_type, created_at FROM locations WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: locations || [],
    });
  } catch (error) {
    console.error("Get locations error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch locations" });
  }
};

// Get a specific location
export const handleGetLocation: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const location = await dbGet(
      `SELECT * FROM locations WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (!location) {
      return res.status(404).json({ success: false, message: "Location not found" });
    }

    res.json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error("Get location error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch location" });
  }
};

// Delete a location
export const handleDeleteLocation: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const location = await dbGet(
      `SELECT id FROM locations WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (!location) {
      return res.status(404).json({ success: false, message: "Location not found" });
    }

    await dbRun(`DELETE FROM locations WHERE id = ?`, [id]);

    res.json({ success: true, message: "Location deleted" });
  } catch (error) {
    console.error("Delete location error:", error);
    res.status(500).json({ success: false, message: "Failed to delete location" });
  }
};

// Create a route between two locations
export const handleCreateRoute: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { start_location_id, end_location_id } = req.body as RouteInput;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!start_location_id || !end_location_id) {
      return res.status(400).json({ success: false, message: "Missing location IDs" });
    }

    // Verify locations belong to user
    const startLoc = await dbGet(
      `SELECT latitude, longitude FROM locations WHERE id = ? AND user_id = ?`,
      [start_location_id, userId]
    );
    const endLoc = await dbGet(
      `SELECT latitude, longitude FROM locations WHERE id = ? AND user_id = ?`,
      [end_location_id, userId]
    );

    if (!startLoc || !endLoc) {
      return res.status(404).json({ success: false, message: "One or both locations not found" });
    }

    // Calculate distance (simple Haversine formula)
    const distance = calculateDistance(startLoc.latitude, startLoc.longitude, endLoc.latitude, endLoc.longitude);

    const routeId = generateId();
    const estimatedDuration = Math.round((distance / 50) * 60); // Assume 50 km/h average

    await dbRun(
      `INSERT INTO routes (id, user_id, start_location_id, end_location_id, distance_km, estimated_duration_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [routeId, userId, start_location_id, end_location_id, distance, estimatedDuration]
    );

    const route = await dbGet(`SELECT * FROM routes WHERE id = ?`, [routeId]);

    res.status(201).json({
      success: true,
      data: route,
    });
  } catch (error) {
    console.error("Create route error:", error);
    res.status(500).json({ success: false, message: "Failed to create route" });
  }
};

// Get all user routes
export const handleGetRoutes: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const routes = await dbAll(
      `SELECT * FROM routes WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: routes || [],
    });
  } catch (error) {
    console.error("Get routes error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch routes" });
  }
};

// Delete a route
export const handleDeleteRoute: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const route = await dbGet(
      `SELECT id FROM routes WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    await dbRun(`DELETE FROM routes WHERE id = ?`, [id]);

    res.json({ success: true, message: "Route deleted" });
  } catch (error) {
    console.error("Delete route error:", error);
    res.status(500).json({ success: false, message: "Failed to delete route" });
  }
};

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}
