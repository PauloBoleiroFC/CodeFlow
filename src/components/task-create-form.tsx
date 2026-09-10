"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BranchFormSection,
  syncStructuredBranch,
  type BranchFormValue,
} from "@/components/branch-form-section";
import { FALLBACK_BRANCH_TYPE, formatApiError, generateSlug } from "@/lib/branch";
import { Button } from "@/components/ui/button";
import { taskHref } from "@/lib/task-paths";

type ProjectOption = {
  id: string;
  name: string;
};

type Props = {
  initialProjectId?: string | null;
};

const empty: BranchFormValue = {
  title: "",
  summary: "",
  cardNumber: "",
  branchType: FALLBACK_BRANCH_TYPE,
  suggestedBranchType: null,
  branchTypeReason: null,
  memoryMessage: null,
  slug: "",
  branchName: "",
  branchManual: false,
  tags: [],
};

export function TaskCreateForm({ initialProjectId = null }: Props) {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [form, setForm] = useState<BranchFormValue>(empty);
  const [projectId, setProjectId] = useState<string>(initialProjectId ?? "");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [globalFormat, setGlobalFormat] = useState<string | undefined>();
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch("/api/projects").then((r) => r.json()) as Promise<ProjectOption[]>,
      fetch("/api/settings").then((r) => r.json()) as Promise<{
        settings: { branchFormat: string };
      }>,
    ])
      .then(([list, settings]) => {
        setProjects(list);
        setGlobalFormat(settings.settings.branchFormat);
      })
      .catch(() => {
        setProjects([]);
      });
  }, []);

  function updateForm(partial: Partial<BranchFormValue>) {
    setForm((prev) =>
      syncStructuredBranch({ ...prev, ...partial }, globalFormat),
    );
  }

  async function analyze(text = rawText || form.title) {
    if (!text.trim()) {
      setError("Descreva a tarefa para analisar.");
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
          globalFormat,
        ),
      );
      setRawText(text);
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
      const synced = syncStructuredBranch(form, globalFormat);
      const payload = {
        projectId: projectId || null,
        title: synced.title || rawText,
        summary: synced.summary,
        cardNumber: synced.cardNumber || null,
        branchType: synced.branchType,
        suggestedBranchType: synced.suggestedBranchType,
        branchTypeReason: synced.branchTypeReason,
        slug: synced.slug || generateSlug(synced.title || rawText),
        branchName: synced.branchName,
        branchManual: synced.branchManual,
        tags: synced.tags,
      };

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          formatApiError(data.error, "Não foi possível salvar a tarefa"),
        );
      }
      router.push(taskHref({ id: data.id, projectId: data.projectId }));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <label>
        Projeto
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          aria-label="Projeto da tarefa"
        >
          <option value="">Nenhum projeto</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="hint">Opcional — a tarefa pode existir sem projeto.</span>
      </label>

      <label>
        Descreva a tarefa
        <textarea
          rows={4}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder='Ex.: "Corrigir cálculo do investimento"'
        />
      </label>

      <div className="actions">
        <Button
          type="button"
          variant="secondary"
          onClick={() => analyze()}
          loading={analyzing}
        >
          Analisar tarefa
        </Button>
      </div>

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
          required
        />
      </label>

      <label>
        Resumo
        <textarea
          rows={3}
          value={form.summary}
          onChange={(e) => updateForm({ summary: e.target.value })}
        />
      </label>

      <BranchFormSection
        value={form}
        onChange={setForm}
        format={globalFormat}
        analyzing={analyzing}
        onAnalyze={() => analyze()}
      />

      {error ? <p className="error">{error}</p> : null}

      <Button type="submit" variant="success" loading={saving}>
        Criar tarefa
      </Button>
    </form>
  );
}
