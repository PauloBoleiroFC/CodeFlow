import type { SessionUser } from "@/lib/auth-client";

export const SESSION_COOKIE = "codeflow_session";

function authSecret() {
  return process.env.AUTH_SECRET || "codeflow-dev-secret-change-me";
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

async function sign(payload: string) {
  const data = new TextEncoder().encode(`${payload}.${authSecret()}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toBase64Url(new Uint8Array(digest));
}

export async function createSessionToken(user: SessionUser) {
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify(user)));
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

export async function parseSessionToken(
  token: string | undefined | null,
): Promise<SessionUser | null> {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = await sign(payload);
  const a = fromBase64Url(signature);
  const b = fromBase64Url(expected);
  if (!timingSafeEqual(a, b)) return null;

  try {
    const json = new TextDecoder().decode(fromBase64Url(payload));
    const user = JSON.parse(json) as SessionUser;
    if (!user?.id || !user?.email || !user?.name) return null;
    return user;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 14) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
