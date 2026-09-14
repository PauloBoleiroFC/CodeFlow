"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  FolderKanban,
  Home,
  LogOut,
  Settings,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useShell } from "@/components/layout/app-shell";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tasks", label: "Tarefas", icon: ClipboardList },
  { href: "/projects", label: "Projetos", icon: FolderKanban },
  { href: "/wiki", label: "Wiki", icon: BookOpen },
  { href: "/settings", label: "Configurações", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";

  const isNestedProjectTask = /^\/projects\/[^/]+\/tasks(\/|$)/.test(pathname);

  if (href === "/tasks") {
    return (
      pathname === "/tasks" ||
      pathname.startsWith("/tasks/") ||
      isNestedProjectTask
    );
  }

  if (href === "/projects") {
    if (isNestedProjectTask) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, closeMobile } = useShell();
  const { user, initials, logout, openProfile } = useAuth();

  return (
    <>
      <div
        className="sidebar-overlay"
        onClick={closeMobile}
        aria-hidden="true"
      />
      <aside className="sidebar" aria-label="Navegação principal">
        <Link href="/" className="sidebar-brand" onClick={closeMobile}>
          <span className="brand-mark" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 7.5L10 4l6 3.5v7L10 18l-6-3.5v-7z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M10 4v14M4 7.5l6 3.5 6-3.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="brand-text">
            <span className="brand-code">Code</span>{" "}
            <span className="brand-flow">Flow</span>
          </span>
        </Link>

        <nav className="sidebar-nav">
          <p className="nav-section-label">Menu</p>
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="nav-item"
                data-active={active ? "true" : "false"}
                onClick={closeMobile}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
              >
                <Icon aria-hidden />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="user-chip user-chip-btn"
            title={collapsed ? user?.name ?? "Usuário" : undefined}
            onClick={() => {
              closeMobile();
              openProfile();
            }}
            aria-label="Abrir meu perfil"
          >
            <span className="avatar" aria-hidden>
              {initials}
            </span>
            <div className="user-meta">
              <strong>{user?.name ?? "Usuário"}</strong>
              <span>{user?.role ?? "admin"}</span>
            </div>
          </button>
          <button
            type="button"
            className="nav-item"
            title={collapsed ? "Sair" : undefined}
            onClick={() => {
              void logout();
            }}
          >
            <LogOut aria-hidden />
            <span className="nav-label">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
