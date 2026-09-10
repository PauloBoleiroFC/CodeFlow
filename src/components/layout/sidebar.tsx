"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import { useShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/tasks", label: "Tarefas", icon: ClipboardList },
  { href: "/projects", label: "Projetos", icon: FolderKanban },
  { href: "/wiki", label: "Wiki", icon: BookOpen },
  { href: "/settings", label: "Configurações", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed, closeMobile } = useShell();

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
                d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </span>
          <span className="brand-text">Codeflow</span>
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
          <div className="user-chip" title={collapsed ? "Paulo" : undefined}>
            <span className="avatar" aria-hidden>
              P
            </span>
            <div className="user-meta">
              <strong>Paulo</strong>
              <span>Admin</span>
            </div>
          </div>
          <button
            type="button"
            className="nav-item"
            title={collapsed ? "Sair" : undefined}
            onClick={() => {
              /* auth not implemented — UI only */
            }}
          >
            <LogOut aria-hidden />
            <span className="nav-label">Sair</span>
          </button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="sidebar-collapse-btn desktop-only"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          leftIcon={
            collapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <PanelLeftClose size={16} />
            )
          }
        >
          <span className="nav-label">
            {collapsed ? "Expandir" : "Recolher"}
          </span>
        </Button>
      </aside>
    </>
  );
}
