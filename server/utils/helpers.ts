import { createHash } from "crypto";

// Generate unique IDs
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Simple JWT-like token (for MVP - replace with proper JWT in production)
export function generateToken(userId: string): string {
  const payload = {
    userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
  };

  // Simple encoding (not secure - use proper JWT in production)
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = createHash("sha256").update(encoded + process.env.SECRET_KEY || "dev-secret").digest("hex");

  return `${encoded}.${signature}`;
}

// Verify token
export function verifyToken(token: string): string | null {
  try {
    const [encoded, signature] = token.split(".");
    const expectedSignature = createHash("sha256")
      .update(encoded + process.env.SECRET_KEY || "dev-secret")
      .digest("hex");

    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encoded, "base64").toString());

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload.userId;
  } catch {
    return null;
  }
}
