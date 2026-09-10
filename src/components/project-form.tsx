"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { formatApiError, generateSlug } from "@/lib/branch";
import { Button } from "@/components/ui/button";
import { RichTextField } from "@/components/ui/rich-text-field";
import { useToast } from "@/components/toast";

export type ProjectLinkForm = {
  id?: string;
  name: string;
  url: string;
};

export type ProjectFormData = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  observations: string;
  links: ProjectLinkForm[];
};

type Props = {
  initial?: ProjectFormData;
  mode: "create" | "edit";
};

export function ProjectForm({ initial, mode }: Props) {
  const router = useRouter();
  const { show, Toast } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [observations, setObservations] = useState(
    initial?.observations ?? "",
  );
  const [links, setLinks] = useState<ProjectLinkForm[]>(
    initial?.links?.length ? initial.links : [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(generateSlug(value));
    }
  }

  function updateLink(index: number, partial: Partial<ProjectLinkForm>) {
    setLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, ...partial } : link)),
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || generateSlug(name),
        description: description.trim() || null,
        observations: observations.trim() || null,
        links: links
          .map((l) => ({
            id: l.id,
            name: l.name.trim(),
            url: l.url.trim(),
          }))
          .filter((l) => l.name || l.url),
      };

      const res =
        mode === "create"
          ? await fetch("/api/projects", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/projects/${initial!.id}`, {
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
          ? "Projeto criado com sucesso."
          : "Projeto atualizado com sucesso.",
      );
      router.push(`/projects/${data.id}`);
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
          Nome
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="DataTrade"
            required
            minLength={2}
            maxLength={120}
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
            placeholder="datatrade"
            required
          />
          <span className="hint">Identificador único na URL e nas configs.</span>
        </label>

        <RichTextField
          label="Descrição"
          optional
          value={description}
          onChange={setDescription}
          placeholder="Descreva o projeto..."
        />

        <RichTextField
          label="Observações"
          optional
          value={observations}
          onChange={setObservations}
          placeholder="Notas técnicas, contexto, cuidados..."
        />

        <div className="stack">
          <div className="page-hero-row">
            <h3 className="section-title">Links</h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() =>
                setLinks((prev) => [...prev, { name: "", url: "" }])
              }
            >
              Adicionar link
            </Button>
          </div>

          {links.length === 0 ? (
            <p className="muted">Nenhum link cadastrado.</p>
          ) : (
            links.map((link, index) => (
              <div key={link.id ?? `new-${index}`} className="link-editor-row">
                <label>
                  Nome
                  <input
                    value={link.name}
                    onChange={(e) => updateLink(index, { name: e.target.value })}
                    placeholder="GitHub"
                    required
                  />
                </label>
                <label>
                  URL
                  <input
                    value={link.url}
                    onChange={(e) => updateLink(index, { url: e.target.value })}
                    placeholder="https://..."
                    type="url"
                    required
                  />
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 size={14} />}
                  onClick={() =>
                    setLinks((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  Remover
                </Button>
              </div>
            ))
          )}
        </div>

        {error ? <p className="error">{error}</p> : null}

        <div className="actions">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="success" loading={saving}>
            {mode === "create" ? "Criar projeto" : "Salvar alterações"}
          </Button>
        </div>
      </form>
      <Toast />
    </>
  );
}
