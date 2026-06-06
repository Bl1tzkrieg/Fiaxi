import { RequestHandler } from "express";
import bcryptjs from "bcryptjs";
import { dbRun, dbGet } from "../db";
import { RegisterRequest, LoginRequest, AuthResponse, User } from "@shared/api";
import { generateId, generateToken } from "../utils/helpers";

export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const { email, password, full_name, role, phone } = req.body as RegisterRequest;

    // Validate input
    if (!email || !password || !full_name || !role) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if user already exists
    const existing = await dbGet(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const password_hash = await bcryptjs.hash(password, 10);
    const userId = generateId();

    // Create user
    await dbRun(
      `INSERT INTO users (id, email, password_hash, full_name, role, phone, rating)
       VALUES (?, ?, ?, ?, ?, ?, 5.0)`,
      [userId, email, password_hash, full_name, role, phone || null]
    );

    const user = await dbGet(`SELECT id, email, full_name, role, phone, rating, created_at, updated_at FROM users WHERE id = ?`, [userId]);
    const token = generateToken(userId);

    const response: AuthResponse = {
      success: true,
      user: user as User,
      token,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    // Find user
    const user = await dbGet(
      `SELECT id, email, password_hash, full_name, role, phone, rating, created_at, updated_at FROM users WHERE email = ?`,
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Verify password
    const isValid = await bcryptjs.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user.id);

    const response: AuthResponse = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone,
        rating: user.rating,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      token,
    };

    res.json(response);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const handleGetProfile: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await dbGet(
      `SELECT id, email, full_name, role, phone, profile_image, bio, rating, created_at, updated_at FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

export const handleUpdateProfile: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { full_name, phone, bio, profile_image } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await dbRun(
      `UPDATE users SET full_name = COALESCE(?, full_name),
                        phone = COALESCE(?, phone),
                        bio = COALESCE(?, bio),
                        profile_image = COALESCE(?, profile_image),
                        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [full_name || null, phone || null, bio || null, profile_image || null, userId]
    );

    const user = await dbGet(
      `SELECT id, email, full_name, role, phone, profile_image, bio, rating, created_at, updated_at FROM users WHERE id = ?`,
      [userId]
    );

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};
