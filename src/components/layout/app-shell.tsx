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

type ShellContextValue = {
  collapsed: boolean;
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
  closeMobile: () => void;
};

const ShellContext = createContext<ShellContextValue | null>(null);

const STORAGE_KEY = "codeflow.sidebar.collapsed";

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used within AppShell");
  return ctx;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const frame = requestAnimationFrame(() => {
      if (stored === "1") setCollapsed(true);
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const value = useMemo(
    () => ({
      collapsed,
      mobileOpen,
      toggleCollapsed,
      setMobileOpen,
      closeMobile,
    }),
    [collapsed, mobileOpen, toggleCollapsed, closeMobile],
  );

  return (
    <ShellContext.Provider value={value}>
      <div
        className="app-shell"
        data-collapsed={ready && collapsed ? "true" : "false"}
        data-mobile-open={mobileOpen ? "true" : "false"}
      >
        {children}
      </div>
    </ShellContext.Provider>
  );
}
