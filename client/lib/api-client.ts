import { ApiResponse, User, Location, Route, TrackingSession } from "@shared/api";

// Store token in localStorage
export const setAuthToken = (token: string) => {
  localStorage.setItem("auth_token", token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem("auth_token");
};

export const clearAuthToken = () => {
  localStorage.removeItem("auth_token");
};

// Get auth headers
const getHeaders = (includeAuth = true): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Generic fetch wrapper with error handling
async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  includeAuth = true
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(includeAuth),
        ...(options.headers || {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "An error occurred",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("API error:", error);
    return {
      success: false,
      message: "Network error",
    };
  }
}

// ===== AUTH API =====
export const authAPI = {
  register: async (email: string, password: string, fullName: string, role: "driver" | "citizen") => {
    const res = await apiFetch<User>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
        role,
      }),
    }, false);

    if (res.success) {
      // Extract token from response if available
      const rawRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: getHeaders(false),
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
        }),
      });
      const data = await rawRes.json();
      if (data.token) {
        setAuthToken(data.token);
      }
    }

    return res;
  },

  login: async (email: string, password: string) => {
    const rawRes = await fetch("/api/auth/login", {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify({ email, password }),
    });

    const data = await rawRes.json();

    if (data.success && data.token) {
      setAuthToken(data.token);
    }

    return {
      success: data.success,
      data: data.user,
      message: data.message,
    };
  },

  getProfile: () => apiFetch<User>("/api/auth/profile"),

  updateProfile: (updates: Partial<User>) =>
    apiFetch<User>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  logout: () => {
    clearAuthToken();
    return { success: true };
  },
};

// ===== LOCATION API =====
export const locationsAPI = {
  save: (data: { latitude: number; longitude: number; address?: string; location_type: string }) =>
    apiFetch<Location>("/api/locations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAll: () => apiFetch<Location[]>("/api/locations"),

  get: (id: string) => apiFetch<Location>(`/api/locations/${id}`),

  delete: (id: string) =>
    apiFetch<void>(`/api/locations/${id}`, {
      method: "DELETE",
    }),
};

// ===== ROUTES API =====
export const routesAPI = {
  create: (startId: string, endId: string) =>
    apiFetch<Route>("/api/routes", {
      method: "POST",
      body: JSON.stringify({
        start_location_id: startId,
        end_location_id: endId,
      }),
    }),

  getAll: () => apiFetch<Route[]>("/api/routes"),

  delete: (id: string) =>
    apiFetch<void>(`/api/routes/${id}`, {
      method: "DELETE",
    }),
};

// ===== TRACKING API =====
export const trackingAPI = {
  startSession: () =>
    apiFetch<TrackingSession>("/api/tracking/sessions", {
      method: "POST",
    }),

  getActiveSession: () => apiFetch<TrackingSession | null>("/api/tracking/sessions/active"),

  getSessions: () => apiFetch<TrackingSession[]>("/api/tracking/sessions"),

  getSession: (id: string) =>
    apiFetch<{ session: TrackingSession; history: Array<any> }>(`/api/tracking/sessions/${id}`),

  addLocation: (sessionId: string, data: { latitude: number; longitude: number; accuracy?: number; speed?: number; heading?: number }) =>
    apiFetch<any>(`/api/tracking/sessions/${sessionId}/location`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  pauseSession: (id: string) =>
    apiFetch<TrackingSession>(`/api/tracking/sessions/${id}/pause`, {
      method: "POST",
    }),

  resumeSession: (id: string) =>
    apiFetch<TrackingSession>(`/api/tracking/sessions/${id}/resume`, {
      method: "POST",
    }),

  endSession: (id: string) =>
    apiFetch<TrackingSession>(`/api/tracking/sessions/${id}/end`, {
      method: "POST",
    }),
};
