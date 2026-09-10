"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { BranchTypeBadge } from "@/components/ui/branch-type-badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeletons";
import { TaskStatusSelect } from "@/components/task-status-select";
import { useTaskStatusUpdate } from "@/hooks/use-task-status-update";
import { BRANCH_TYPES } from "@/lib/branch";
import { taskHref } from "@/lib/task-paths";
import {
  isTaskStatus,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskStatus,
  DEFAULT_TASK_STATUS,
} from "@/lib/task-status";

type Row = {
  id: string;
  title: string;
  branchName: string;
  branchType: string;
  status: string;
  cardNumber: string | null;
  updatedAt: string;
  projectId: string | null;
  projectName: string | null;
};

export default function TasksPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [sort, setSort] = useState<"updated" | "title">("updated");

  const onStatusUpdated = useCallback((taskId: string, status: TaskStatus) => {
    setRows((prev) =>
      prev.map((row) => (row.id === taskId ? { ...row, status } : row)),
    );
  }, []);

  const { updateStatus, pendingId, error, setError } =
    useTaskStatusUpdate(onStatusUpdated);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [tasks, projectList] = await Promise.all([
          fetch("/api/tasks").then((r) => r.json()) as Promise<Row[]>,
          fetch("/api/projects").then((r) => r.json()) as Promise<
            Array<{ id: string; name: string }>
          >,
        ]);
        if (!cancelled) {
          setRows(tasks);
          setProjects(projectList);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = rows.filter((row) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        row.title.toLowerCase().includes(q) ||
        row.branchName.toLowerCase().includes(q) ||
        (row.cardNumber ?? "").includes(q);
      const matchesType =
        typeFilter === "all" || row.branchType === typeFilter;
      const matchesStatus =
        statusFilter === "all" || row.status === statusFilter;
      const matchesProject =
        projectFilter === "all" ||
        (projectFilter === "none"
          ? !row.projectId
          : row.projectId === projectFilter);
      return matchesQuery && matchesType && matchesStatus && matchesProject;
    });

    list = [...list].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title, "pt-BR");
      return (
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
    return list;
  }, [rows, query, typeFilter, statusFilter, projectFilter, sort]);

  return (
    <div>
      <PageHeader
        title="Tarefas"
        description="Gerencie suas demandas, branches e histórico."
        actions={
          <ButtonLink href="/tasks/new" leftIcon={<Plus size={16} />}>
            Nova tarefa
          </ButtonLink>
        }
      />

      <div className="toolbar">
        <div className="toolbar-search">
          <Search aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, branch ou card..."
            aria-label="Buscar tarefas"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filtrar por status"
          style={{ width: "auto", minWidth: 160 }}
        >
          <option value="all">Todos os status</option>
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {TASK_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filtrar por tipo"
          style={{ width: "auto", minWidth: 140 }}
        >
          <option value="all">Todos os tipos</option>
          {BRANCH_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          aria-label="Filtrar por projeto"
          style={{ width: "auto", minWidth: 160 }}
        >
          <option value="all">Todos os projetos</option>
          <option value="none">Sem projeto</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "updated" | "title")}
          aria-label="Ordenar"
          style={{ width: "auto", minWidth: 140 }}
        >
          <option value="updated">Mais recentes</option>
          <option value="title">Título</option>
        </select>
      </div>

      {error ? (
        <p className="error" style={{ marginBottom: "0.75rem" }}>
          {error}{" "}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
          >
            Fechar
          </Button>
        </p>
      ) : null}

      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={
            rows.length === 0
              ? "Você ainda não possui tarefas."
              : "Nenhuma tarefa encontrada"
          }
          description={
            rows.length === 0
              ? "Crie uma tarefa para começar."
              : "Não encontramos tarefas com esses filtros."
          }
          action={
            rows.length === 0 ? (
              <ButtonLink href="/tasks/new">+ Nova tarefa</ButtonLink>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setTypeFilter("all");
                  setStatusFilter("all");
                  setProjectFilter("all");
                }}
              >
                Limpar filtros
              </Button>
            )
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Card</th>
                <th>Título</th>
                <th>Projeto</th>
                <th>Tipo</th>
                <th>Branch</th>
                <th>Status</th>
                <th className="col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const status = isTaskStatus(row.status)
                  ? row.status
                  : DEFAULT_TASK_STATUS;
                const href = taskHref({
                  id: row.id,
                  projectId: row.projectId,
                });
                return (
                  <tr key={row.id}>
                    <td>{row.cardNumber ?? "—"}</td>
                    <td>
                      <Link href={href}>{row.title}</Link>
                    </td>
                    <td>{row.projectName ?? "—"}</td>
                    <td>
                      <BranchTypeBadge type={row.branchType} />
                    </td>
                    <td>
                      <code>{row.branchName}</code>
                    </td>
                    <td>
                      <TaskStatusSelect
                        value={status}
                        disabled={pendingId === row.id}
                        onChange={(next) => {
                          void updateStatus(row.id, next).catch(() => {
                            /* error surfaced via hook */
                          });
                        }}
                      />
                    </td>
                    <td className="col-actions">
                      <div className="list-actions">
                        <ButtonLink href={href} variant="ghost" size="sm">
                          Ver
                        </ButtonLink>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
