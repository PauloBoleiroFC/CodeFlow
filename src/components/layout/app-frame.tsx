"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth-provider";
import { AppShell } from "@/components/layout/app-shell";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { ProfileModal } from "@/components/profile-modal";

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return (
    <AuthProvider>
      <AppShell>
        <Sidebar />
        <div className="app-main">
          <Header />
          <div className="app-content">{children}</div>
        </div>
        <ProfileModal />
      </AppShell>
    </AuthProvider>
  );
}
