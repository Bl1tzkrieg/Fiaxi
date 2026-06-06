// User Types
export type UserRole = "driver" | "citizen" | "admin";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  profile_image?: string;
  bio?: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  locations?: Location[];
  routes?: Route[];
}

// Auth Types
export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

// Location Types
export type LocationType = "home" | "work" | "pickup" | "dropoff" | "current";

export interface Location {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  address?: string;
  location_type: LocationType;
  created_at: string;
}

export interface LocationInput {
  latitude: number;
  longitude: number;
  address?: string;
  location_type: LocationType;
}

// Route Types
export interface Route {
  id: string;
  user_id: string;
  start_location_id: string;
  end_location_id: string;
  distance_km?: number;
  estimated_duration_minutes?: number;
  route_data?: string;
  created_at: string;
}

export interface RouteInput {
  start_location_id: string;
  end_location_id: string;
}

// Tracking Session Types
export type SessionStatus = "active" | "paused" | "completed";

export interface TrackingSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  status: SessionStatus;
  created_at: string;
}

export interface LocationHistoryPoint {
  id: string;
  session_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface LocationHistoryInput {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

export interface DemoResponse {
  message: string;
}
