"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth-client";
import { userInitials } from "@/lib/auth-client";

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  initials: string;
  profileOpen: boolean;
  profileNonce: number;
  openProfile: () => void;
  closeProfile: () => void;
  applyUser: (user: SessionUser) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileNonce, setProfileNonce] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as SessionUser;
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setProfileOpen(false);
    router.replace("/login");
    router.refresh();
  }, [router]);

  const openProfile = useCallback(() => {
    setProfileNonce((n) => n + 1);
    setProfileOpen(true);
  }, []);
  const closeProfile = useCallback(() => setProfileOpen(false), []);
  const applyUser = useCallback((next: SessionUser) => setUser(next), []);

  const value = useMemo(
    () => ({
      user,
      loading,
      initials: userInitials(user?.name ?? "U"),
      profileOpen,
      profileNonce,
      openProfile,
      closeProfile,
      applyUser,
      refresh,
      logout,
    }),
    [
      user,
      loading,
      profileOpen,
      profileNonce,
      openProfile,
      closeProfile,
      applyUser,
      refresh,
      logout,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
