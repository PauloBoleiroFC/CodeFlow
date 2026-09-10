"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, Search } from "lucide-react";
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
  return "Codeflow";
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { setMobileOpen } = useShell();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);

  const title = resolveTitle(pathname);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="mobile-only"
            aria-label="Abrir menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} />
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
            <Search size={16} />
            <span>Buscar tarefas, projetos ou wiki...</span>
            <kbd className="desktop-only">Ctrl K</kbd>
          </button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Notificações"
          >
            <Bell size={16} />
          </Button>
          <span className="avatar" aria-hidden>
            P
          </span>
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
                  setActive((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                }
                if (e.key === "Enter" && filtered[active]) {
                  go(filtered[active].href);
                }
              }}
              placeholder="Buscar tarefas, projetos ou wiki..."
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
