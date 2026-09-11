/** Client-safe helpers (no Node crypto). */

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function userInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
