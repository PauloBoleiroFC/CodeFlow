"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, Search } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

type SearchItem = {
  id: string;
  label: string;
  href: string;
  kind: "projeto" | "tarefa";
};

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/tasks": "Tarefas",
  "/tasks/new": "Nova tarefa",
  "/projects": "Projetos",
  "/projects/new": "Novo projeto",
  "/wiki": "Wiki",
  "/wiki/new": "Novo artigo",
  "/settings": "Configurações",
};

function resolveTitle(pathname: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.includes("/tasks/new")) return "Nova tarefa";
  if (pathname.includes("/edit")) return "Editar projeto";
  if (pathname.includes("/tasks/")) return "Detalhe da tarefa";
  if (pathname.startsWith("/projects/")) return "Projeto";
  if (pathname.startsWith("/wiki/")) return "Wiki";
  return "Code Flow";
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen, closeMobile } =
    useShell();
  const { initials, user, openProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const title = resolveTitle(pathname);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setNotificationsOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!notificationsRef.current?.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    if (notificationsOpen) {
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }
  }, [notificationsOpen]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [projects, allTasks] = await Promise.all([
          fetch("/api/projects").then((r) => r.json()) as Promise<
            Array<{ id: string; name: string }>
          >,
          fetch("/api/tasks").then((r) => r.json()) as Promise<
            Array<{
              id: string;
              title: string;
              projectId: string | null;
            }>
          >,
        ]);

        if (cancelled) return;

        const projectItems: SearchItem[] = projects.map((p) => ({
          id: p.id,
          label: p.name,
          href: `/projects/${p.id}`,
          kind: "projeto",
        }));

        const taskItems: SearchItem[] = allTasks.map((t) => ({
          id: t.id,
          label: t.title,
          href: t.projectId
            ? `/projects/${t.projectId}/tasks/${t.id}`
            : `/tasks/${t.id}`,
          kind: "tarefa",
        }));

        setItems([...projectItems, ...taskItems]);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filtered = useMemo(
    () =>
      items
        .filter((item) =>
          item.label.toLowerCase().includes(query.trim().toLowerCase()),
        )
        .slice(0, 12),
    [items, query],
  );

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function onMenuClick() {
    if (window.matchMedia("(max-width: 900px)").matches) {
      if (mobileOpen) closeMobile();
      else setMobileOpen(true);
      return;
    }
    toggleCollapsed();
  }

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={
              collapsed ? "Expandir menu" : "Recolher ou fechar menu"
            }
            aria-expanded={mobileOpen || !collapsed}
            onClick={onMenuClick}
          >
            <Menu size={18} aria-hidden />
          </Button>
          <div>
            <h1 className="page-title-sm">{title}</h1>
            {pathname !== "/" ? (
              <div className="breadcrumb">
                <Link href="/">Home</Link>
                <span>/</span>
                <span>{title}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="header-right">
          <button
            type="button"
            className="search-trigger"
            onClick={() => setOpen(true)}
            aria-label="Buscar"
          >
            <Search size={16} aria-hidden />
            <span>Pesquisar...</span>
            <kbd className="desktop-only">Ctrl K</kbd>
          </button>

          <div className="header-notifications" ref={notificationsRef}>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Notificações"
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen((prev) => !prev)}
            >
              <Bell size={16} aria-hidden />
            </Button>
            {notificationsOpen ? (
              <div className="notifications-panel" role="dialog" aria-label="Notificações">
                <p className="section-title" style={{ marginBottom: "0.35rem" }}>
                  Notificações
                </p>
                <p className="muted" style={{ margin: 0 }}>
                  Nenhuma notificação no momento.
                </p>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="avatar avatar-btn"
            title={user?.name ?? "Usuário"}
            aria-label="Abrir meu perfil"
            onClick={openProfile}
          >
            {initials}
          </button>
        </div>
      </header>

      {open ? (
        <div
          className="cmdk-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Busca global"
          onClick={() => setOpen(false)}
        >
          <div className="cmdk" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((i) =>
                    Math.min(i + 1, Math.max(filtered.length - 1, 0)),
                  );
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                }
                if (e.key === "Enter" && filtered[active]) {
                  go(filtered[active].href);
                }
              }}
              placeholder="Pesquisar..."
            />
            <div className="cmdk-list">
              {loading ? (
                <p className="cmdk-empty">Carregando...</p>
              ) : filtered.length === 0 ? (
                <p className="cmdk-empty">Nenhum resultado</p>
              ) : (
                filtered.map((item, index) => (
                  <button
                    key={`${item.kind}-${item.id}`}
                    type="button"
                    className="cmdk-item"
                    data-active={index === active ? "true" : "false"}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(item.href)}
                  >
                    <span className="badge badge-neutral">{item.kind}</span>
                    <span>{item.label}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
