// Lightweight, self-contained auth for the /driver portal.
// Uses argon2 (already a dependency) for passwords and a DB-backed session
// table (driver_sessions) keyed by an HttpOnly cookie. Deliberately independent
// of the platform's Auth.js (which is wired for Neon cloud + HTTPS).
import { hash, verify } from "argon2";
import { randomBytes } from "node:crypto";
import sql from "@/app/api/utils/sql";

export const COOKIE_NAME = "driver_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function hashPassword(password) {
  return hash(password);
}

export async function verifyPassword(passwordHash, password) {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

// Create a session row and return { token, expires }.
export async function createSession(driverId) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_TTL_MS);
  await sql`
    INSERT INTO driver_sessions (token, driver_id, expires_at)
    VALUES (${token}, ${driverId}, ${expires})
  `;
  return { token, expires };
}

export async function deleteSession(token) {
  if (!token) return;
  await sql`DELETE FROM driver_sessions WHERE token = ${token}`;
}

// Secure flag only over HTTPS so the cookie still works on http://localhost.
function isHttps(request) {
  if (process.env.AUTH_URL?.startsWith("https")) return true;
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export function sessionCookie(token, expires, request) {
  const maxAge = Math.max(0, Math.floor((expires.getTime() - Date.now()) / 1000));
  const parts = [
    `${COOKIE_NAME}=${token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (isHttps(request)) parts.push("Secure");
  return parts.join("; ");
}

export function clearCookie(request) {
  const parts = [`${COOKIE_NAME}=`, "HttpOnly", "Path=/", "SameSite=Lax", "Max-Age=0"];
  if (isHttps(request)) parts.push("Secure");
  return parts.join("; ");
}

export function readCookie(request, name = COOKIE_NAME) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

// Returns the logged-in driver row, or null. The guard for every protected route.
export async function getDriverFromRequest(request) {
  const token = readCookie(request);
  if (!token) return null;
  const rows = await sql`
    SELECT d.id, d.name, d.email, d.phone
    FROM driver_sessions s
    JOIN drivers d ON d.id = s.driver_id
    WHERE s.token = ${token}
      AND s.expires_at > now()
      AND d.is_active = true
    LIMIT 1
  `;
  return rows[0] ?? null;
}
