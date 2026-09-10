"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  BRANCH_TYPES,
  BRANCH_TYPE_LABELS,
  DEFAULT_BRANCH_FORMAT,
  buildBranchName,
} from "@/lib/branch";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeletons";

type SettingsResponse = {
  settings: {
    branchFormat: string;
    defaultBranchType: string;
  };
};

const FORMAT_TOKENS = ["{tipo}", "{num-task}", "{slug}"] as const;

function validateFormat(format: string): string | null {
  const trimmed = format.trim();
  if (!trimmed) return "Formato obrigatório.";
  for (const token of FORMAT_TOKENS) {
    if (!trimmed.includes(token)) {
      return `O formato deve incluir ${token}.`;
    }
  }
  return null;
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [globalFormat, setGlobalFormat] = useState(DEFAULT_BRANCH_FORMAT);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/settings")
      .then((res) => res.json())
      .then((json: SettingsResponse) => {
        setData(json);
        setGlobalFormat(json.settings.branchFormat);
      });
  }, []);

  const preview = useMemo(() => {
    try {
      return buildBranchName({
        type: "feature",
        cardNumber: "123",
        slugSource: "exemplo slug",
        format: globalFormat || DEFAULT_BRANCH_FORMAT,
      }).branchName;
    } catch {
      return "—";
    }
  }, [globalFormat]);

  async function saveGlobal(event: FormEvent) {
    event.preventDefault();
    const formatError = validateFormat(globalFormat);
    if (formatError) {
      setError(formatError);
      setMessage(null);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchFormat: globalFormat }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          typeof body.error === "string" ? body.error : "Falha ao salvar",
        );
      }
      setMessage("Configuração global salva. Todos os projetos usam este formato.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
      setMessage(null);
    } finally {
      setSaving(false);
    }
  }

  if (!data) {
    return (
      <div className="stack">
        <PageHeader
          title="Configurações"
          description="Configuração única aplicada a todos os projetos e tarefas."
        />
        <TableSkeleton rows={4} />
      </div>
    );
  }

  return (
    <main className="stack">
      <PageHeader
        title="Configurações"
        description="Configuração única aplicada a todos os projetos e tarefas."
      />

      <section className="panel">
        <h2 className="section-title">Tabela de referência (tipos)</h2>
        <div className="type-table">
          {BRANCH_TYPES.map((type) => (
            <div key={type} className="type-row">
              <code>{type}/</code>
              <span>{BRANCH_TYPE_LABELS[type]}</span>
            </div>
          ))}
        </div>
      </section>

      <form className="panel stack" onSubmit={saveGlobal}>
        <h2 className="section-title">Formato de branch (global)</h2>
        <p className="muted">
          Não há configuração por projeto. O formato abaixo vale para todo o
          sistema.
        </p>
        <label>
          Formato
          <input
            value={globalFormat}
            onChange={(e) => setGlobalFormat(e.target.value)}
          />
        </label>
        <p className="hint">
          Tokens: {"{tipo}"}, {"{num-task}"}, {"{slug}"}
        </p>
        <p className="hint">
          Preview: <code>{preview}</code>
        </p>
        <Button type="submit" variant="success" loading={saving}>
          Salvar configuração
        </Button>
      </form>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="hint memory">{message}</p> : null}
    </main>
  );
}
