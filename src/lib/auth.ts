import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { SessionUser } from "@/lib/auth-client";
import { parseSessionToken, SESSION_COOKIE } from "@/lib/auth-session";

export type { SessionUser } from "@/lib/auth-client";
export {
  createSessionToken,
  parseSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth-session";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 64);
  const current = Buffer.from(hash, "hex");
  if (current.length !== next.length) return false;
  return timingSafeEqual(current, next);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return parseSessionToken(jar.get(SESSION_COOKIE)?.value);
}
