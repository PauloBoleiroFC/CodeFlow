"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatApiError, generateSlug } from "@/lib/branch";
import { Button } from "@/components/ui/button";
import { RichTextField } from "@/components/ui/rich-text-field";
import { useToast } from "@/components/toast";

export type WikiFormData = {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  projectId: string;
};

type Props = {
  mode: "create" | "edit";
  initial?: WikiFormData;
};

export function WikiArticleForm({ mode, initial }: Props) {
  const router = useRouter();
  const { show, Toast } = useToast();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "));
  const [projectId, setProjectId] = useState(initial?.projectId ?? "");
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/projects")
      .then((r) => r.json())
      .then((list: Array<{ id: string; name: string }>) => setProjects(list))
      .catch(() => setProjects([]));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || generateSlug(title),
        summary: summary.trim(),
        content,
        category: category.trim() || null,
        tags,
        projectId: projectId || null,
      };

      const res =
        mode === "create"
          ? await fetch("/api/wiki", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/wiki/${initial!.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(formatApiError(data.error, "Não foi possível salvar"));
      }

      show(
        mode === "create"
          ? "Artigo criado com sucesso."
          : "Artigo atualizado com sucesso.",
      );
      router.push(`/wiki/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form className="panel stack" onSubmit={onSubmit}>
        <label>
          Título
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(generateSlug(e.target.value));
            }}
            required
            minLength={2}
            maxLength={160}
            placeholder="Estrutura dos relatórios"
          />
        </label>

        <label>
          Slug
          <input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(generateSlug(e.target.value) || e.target.value);
            }}
            required
          />
        </label>

        <label>
          Resumo
          <textarea
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Breve descrição do artigo"
            maxLength={500}
          />
        </label>

        <RichTextField
          label="Conteúdo"
          value={content}
          onChange={setContent}
          placeholder="Escreva o conhecimento técnico..."
        />

        <div className="grid-2">
          <label>
            Categoria
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Relatórios"
            />
          </label>
          <label>
            Projeto (opcional)
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
        </div>

        <label>
          Tags
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="laravel, relatorios, exportacao"
          />
          <span className="hint">Separe por vírgula.</span>
        </label>

        {error ? <p className="error">{error}</p> : null}

        <div className="actions">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" variant="success" loading={saving}>
            {mode === "create" ? "Criar artigo" : "Salvar alterações"}
          </Button>
        </div>
      </form>
      <Toast />
    </>
  );
}
