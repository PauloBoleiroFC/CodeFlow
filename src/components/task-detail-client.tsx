"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  BranchFormSection,
  syncStructuredBranch,
  type BranchFormValue,
} from "@/components/branch-form-section";
import { useAuth } from "@/components/auth-provider";
import { CopyBranchButton } from "@/components/copy-branch-button";
import { DeleteTaskButton } from "@/components/delete-task-button";
import { BranchTypeBadge } from "@/components/ui/branch-type-badge";
import { TaskStatusSelect } from "@/components/task-status-select";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { RichTextField } from "@/components/ui/rich-text-field";
import { useTaskStatusUpdate } from "@/hooks/use-task-status-update";
import {
  formatApiError,
  generateSlug,
  type BranchType,
} from "@/lib/branch";
import { stripHtml, taskHref } from "@/lib/task-paths";
import {
  DEFAULT_TASK_STATUS,
  isTaskStatus,
  type TaskStatus,
} from "@/lib/task-status";

type EventItem = {
  id: string;
  type: string;
  previousValue: string | null;
  newValue: string | null;
  userName: string;
  createdAt: string;
};

type ProjectOption = { id: string; name: string };

type Props = {
  task: {
    id: string;
    title: string;
    summary: string;
    cardNumber: string | null;
    status: string;
    branchType: string;
    suggestedBranchType: string | null;
    branchTypeReason: string | null;
    slug: string;
    branchName: string;
    branchManual: boolean;
    tags: string[];
    projectId: string | null;
    project: {
      id: string;
      name: string;
    } | null;
    events: EventItem[];
  };
  globalBranchFormat?: string | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function TaskDetailClient({ task, globalBranchFormat }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const format = globalBranchFormat ?? undefined;
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState(task.projectId ?? "");
  const [status, setStatus] = useState<TaskStatus>(
    isTaskStatus(task.status) ? task.status : DEFAULT_TASK_STATUS,
  );
  const [events, setEvents] = useState(task.events);
  const [note, setNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [eventPendingDelete, setEventPendingDelete] = useState<EventItem | null>(
    null,
  );

  const [form, setForm] = useState<BranchFormValue>({
    title: task.title,
    summary: task.summary,
    cardNumber: task.cardNumber ?? "",
    branchType: task.branchType as BranchType,
    suggestedBranchType: (task.suggestedBranchType as BranchType) ?? null,
    branchTypeReason: task.branchTypeReason,
    memoryMessage: null,
    slug: task.slug,
    branchName: task.branchName,
    branchManual: task.branchManual,
    tags: task.tags,
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { updateStatus, pendingId } = useTaskStatusUpdate((_, next) => {
    setStatus(next);
    router.refresh();
  });

  useEffect(() => {
    void fetch("/api/projects")
      .then((r) => r.json())
      .then((list: ProjectOption[]) => setProjects(list))
      .catch(() => setProjects([]));
  }, []);

  function updateForm(partial: Partial<BranchFormValue>) {
    setForm((prev) => syncStructuredBranch({ ...prev, ...partial }, format));
  }

  async function analyze() {
    const text = form.summary || form.title;
    if (!text.trim()) {
      setError("Informe título ou resumo para analisar.");
      return;
    }
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          projectId: projectId || null,
          cardNumber: form.cardNumber || null,
          userBranchType:
            form.suggestedBranchType &&
            form.branchType !== form.suggestedBranchType
              ? form.branchType
              : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(formatApiError(data.error, "Falha na análise"));

      setForm((prev) =>
        syncStructuredBranch(
          {
            ...prev,
            title: data.title,
            summary: data.summary,
            branchType: data.branchType,
            suggestedBranchType: data.branchType,
            branchTypeReason: data.branchTypeReason ?? null,
            memoryMessage: data.memoryMessage ?? null,
            slug: data.slug,
            branchName: data.branchName,
            tags: data.tags ?? [],
            branchManual: false,
          },
          format,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setAnalyzing(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const synced = syncStructuredBranch(form, format);
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: synced.title,
          summary: synced.summary,
          cardNumber: synced.cardNumber || null,
          projectId: projectId || null,
          status,
          branchType: synced.branchType,
          slug: synced.slug,
          branchName: synced.branchName,
          branchManual: synced.branchManual,
          tags: synced.tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(formatApiError(data.error, "Falha ao atualizar"));
      }
      setForm((prev) => ({
        ...prev,
        branchName: data.branchName,
        slug: data.slug,
        branchType: data.branchType,
        branchManual: data.branchManual,
      }));
      if (Array.isArray(data.events)) {
        setEvents(
          data.events.map(
            (event: {
              id: string;
              type: string;
              previousValue: string | null;
              newValue: string | null;
              userName: string;
              createdAt: string;
            }) => ({
              ...event,
              createdAt:
                typeof event.createdAt === "string"
                  ? event.createdAt
                  : new Date(event.createdAt).toISOString(),
            }),
          ),
        );
      }
      router.push(taskHref({ id: data.id, projectId: data.projectId }));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  async function addTimelineNote(event: FormEvent) {
    event.preventDefault();
    if (!stripHtml(note)) {
      setError("Informe a observação da timeline.");
      return;
    }
    setNoteSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: note,
          userName: user?.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(formatApiError(data.error, "Falha ao adicionar"));
      }
      setEvents(normalizeEvents(data.events as EventItem[]));
      setNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setNoteSaving(false);
    }
  }

  async function confirmDeleteEvent() {
    if (!eventPendingDelete) return;
    setDeletingEventId(eventPendingDelete.id);
    setError(null);
    try {
      const res = await fetch(
        `/api/tasks/${task.id}/events/${eventPendingDelete.id}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(formatApiError(data.error, "Falha ao excluir"));
      }
      setEvents(normalizeEvents(data.events as EventItem[]));
      setEventPendingDelete(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setDeletingEventId(null);
    }
  }

  function normalizeEvents(list: EventItem[]): EventItem[] {
    return list.map((item) => ({
      ...item,
      createdAt:
        typeof item.createdAt === "string"
          ? item.createdAt
          : new Date(item.createdAt).toISOString(),
    }));
  }

  const displayBranch = form.branchManual
    ? form.branchName
    : syncStructuredBranch(form, format).branchName;

  const projectName =
    projects.find((p) => p.id === projectId)?.name ??
    task.project?.name ??
    "Sem projeto";

  return (
    <div className="stack task-detail">
      <section className="page-hero">
        <div
          className="actions"
          style={{ marginBottom: "0.55rem", justifyContent: "space-between" }}
        >
          <div className="actions">
            <BranchTypeBadge type={form.branchType} />
            <TaskStatusSelect
              value={status}
              disabled={pendingId === task.id}
              onChange={(next) => {
                setStatus(next);
                void updateStatus(task.id, next).catch(() => {
                  setStatus(
                    isTaskStatus(task.status)
                      ? task.status
                      : DEFAULT_TASK_STATUS,
                  );
                });
              }}
            />
          </div>
          <DeleteTaskButton
            taskId={task.id}
            taskTitle={form.title || task.title}
            projectId={projectId || task.projectId}
            compact
          />
        </div>
        <h1 style={{ marginTop: "0.25rem" }}>{form.title || task.title}</h1>
        <p className="muted">
          {projectName}
          {form.cardNumber ? ` · Card #${form.cardNumber}` : ""}
        </p>
      </section>

      <section className="highlight-branch">
        <p className="eyebrow">BRANCH</p>
        <div className="branch-box">
          <code className="branch-hero" style={{ margin: 0 }}>
            {displayBranch}
          </code>
          <CopyBranchButton branchName={displayBranch} />
        </div>
      </section>

      <div className="task-detail-split">
        <div className="task-detail-main stack">
          <form className="stack" onSubmit={onSubmit}>
            <section className="panel stack">
              <h2 className="section-title">Resumo</h2>
              <label>
                Projeto
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="">Nenhum projeto</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Título
                <input
                  value={form.title}
                  onChange={(e) =>
                    updateForm({
                      title: e.target.value,
                      slug: form.branchManual
                        ? form.slug
                        : generateSlug(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Descrição / resumo
                <textarea
                  rows={3}
                  value={form.summary}
                  onChange={(e) => updateForm({ summary: e.target.value })}
                />
              </label>
            </section>

            <BranchFormSection
              value={form}
              onChange={setForm}
              format={format}
              analyzing={analyzing}
              onAnalyze={analyze}
            />

            {error ? <p className="error">{error}</p> : null}
            <Button type="submit" variant="success" loading={saving}>
              Salvar alterações
            </Button>
          </form>
        </div>

        <aside className="task-detail-aside">
          <section className="panel task-timeline-panel">
            <h2 className="section-title" style={{ marginBottom: "1rem" }}>
              Timeline
            </h2>

            <form className="timeline-composer" onSubmit={addTimelineNote}>
              <RichTextField
                label="Nova observação"
                value={note}
                onChange={setNote}
                placeholder="Descreva o andamento, descobertas ou decisões..."
              />
              <Button type="submit" variant="secondary" loading={noteSaving}>
                Adicionar à timeline
              </Button>
            </form>

            <ul className="timeline">
              {events.map((event) => (
                <li key={event.id}>
                  <span className="timeline-dot" aria-hidden />
                  <div className="timeline-item">
                    <div className="timeline-item-head">
                      <time>{formatDate(event.createdAt)}</time>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="btn-sm"
                        aria-label="Excluir item da timeline"
                        title="Excluir"
                        disabled={deletingEventId === event.id}
                        onClick={() => setEventPendingDelete(event)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    {event.type === "branch_changed" ? (
                      <>
                        <p style={{ margin: "0.25rem 0" }}>
                          <strong>Branch alterada</strong>
                        </p>
                        <p style={{ margin: 0 }}>
                          <code>{event.previousValue}</code>
                          <span className="arrow"> → </span>
                          <code>{event.newValue}</code>
                        </p>
                      </>
                    ) : event.type === "project_changed" ? (
                      <>
                        <p style={{ margin: "0.25rem 0" }}>
                          <strong>Projeto alterado</strong>
                        </p>
                        <p style={{ margin: 0 }}>
                          De: {event.previousValue}
                          <span className="arrow"> → </span>
                          Para: {event.newValue}
                        </p>
                      </>
                    ) : event.type === "status_changed" ? (
                      <>
                        <p style={{ margin: "0.25rem 0" }}>
                          <strong>Status alterado</strong>
                        </p>
                        <p style={{ margin: 0 }}>
                          {event.previousValue}
                          <span className="arrow"> → </span>
                          {event.newValue}
                        </p>
                      </>
                    ) : event.type === "note" ? (
                      <>
                        <p style={{ margin: "0.25rem 0" }}>
                          <strong>Observação</strong>
                        </p>
                        <div
                          className="prose-html"
                          style={{ margin: 0 }}
                          dangerouslySetInnerHTML={{
                            __html: event.newValue || "",
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <p style={{ margin: "0.25rem 0" }}>
                          <strong>Tarefa criada</strong>
                        </p>
                        <p style={{ margin: 0 }}>
                          <code>{event.newValue}</code>
                        </p>
                      </>
                    )}
                    <p className="muted">por {event.userName}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <ConfirmModal
        open={Boolean(eventPendingDelete)}
        title="Excluir item da timeline"
        description="Remover este item da timeline? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
        loading={Boolean(deletingEventId)}
        onConfirm={() => {
          void confirmDeleteEvent();
        }}
        onCancel={() => {
          if (!deletingEventId) setEventPendingDelete(null);
        }}
      />
    </div>
  );
}
