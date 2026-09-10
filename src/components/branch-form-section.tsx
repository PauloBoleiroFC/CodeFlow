"use client";

import { useMemo } from "react";
import {
  BRANCH_TYPES,
  BRANCH_TYPE_LABELS,
  buildBranchName,
  generateSlug,
  type BranchType,
} from "@/lib/branch";
import { CopyBranchButton } from "@/components/copy-branch-button";
import { Button } from "@/components/ui/button";

export type BranchFormValue = {
  title: string;
  summary: string;
  cardNumber: string;
  branchType: BranchType;
  suggestedBranchType: BranchType | null;
  branchTypeReason: string | null;
  memoryMessage: string | null;
  slug: string;
  branchName: string;
  branchManual: boolean;
  tags: string[];
};

type Props = {
  value: BranchFormValue;
  onChange: (next: BranchFormValue) => void;
  format?: string;
  analyzing?: boolean;
  onAnalyze?: () => void;
};

export function syncStructuredBranch(
  value: BranchFormValue,
  format?: string,
): BranchFormValue {
  if (value.branchManual) return value;

  const slugSource = value.title || value.summary;
  const slug = value.slug || generateSlug(slugSource);
  if (!slug && !slugSource) {
    return { ...value, slug: "", branchName: "" };
  }

  try {
    const built = buildBranchName({
      type: value.branchType,
      cardNumber: value.cardNumber || null,
      slugSource,
      slug,
      format,
    });
    return {
      ...value,
      slug: built.slug,
      branchName: built.branchName,
      branchType: built.type,
    };
  } catch {
    return value;
  }
}

export function BranchFormSection({
  value,
  onChange,
  format,
  analyzing,
  onAnalyze,
}: Props) {
  const displayBranch = useMemo(() => {
    if (value.branchManual) return value.branchName;
    return syncStructuredBranch(value, format).branchName;
  }, [value, format]);

  function patch(partial: Partial<BranchFormValue>) {
    const next: BranchFormValue = { ...value, ...partial };

    if (partial.branchManual === true) {
      next.branchName = displayBranch || next.branchName;
      onChange(next);
      return;
    }

    if (partial.branchManual === false) {
      onChange(syncStructuredBranch({ ...next, branchManual: false }, format));
      return;
    }

    if (next.branchManual) {
      onChange(next);
      return;
    }

    onChange(syncStructuredBranch(next, format));
  }

  return (
    <section className="panel branch-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Branch sugerida</p>
          <h2>{displayBranch || "—"}</h2>
          {value.branchManual ? (
            <p className="hint warn">Nome da branch personalizado</p>
          ) : null}
        </div>
        {displayBranch ? <CopyBranchButton branchName={displayBranch} /> : null}
      </div>

      <div className="grid-2">
        <label>
          Tipo da branch
          <select
            value={value.branchType}
            onChange={(e) =>
              patch({ branchType: e.target.value as BranchType })
            }
          >
            {BRANCH_TYPES.map((type) => (
              <option key={type} value={type}>
                {type} — {BRANCH_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          {value.suggestedBranchType &&
          value.suggestedBranchType !== value.branchType ? (
            <span className="hint">
              Sugestão da IA: {value.suggestedBranchType}
              {value.branchTypeReason ? ` — ${value.branchTypeReason}` : "."}
              {" "}(você escolheu {value.branchType})
            </span>
          ) : value.branchTypeReason ? (
            <span className="hint">
              Sugestão da IA: “{value.branchTypeReason}”
            </span>
          ) : (
            <span className="hint">
              A IA apenas sugere o tipo — você pode alterar livremente.
            </span>
          )}
          {value.memoryMessage ? (
            <span className="hint memory">{value.memoryMessage}</span>
          ) : null}
        </label>

        <label>
          Número do card
          <input
            value={value.cardNumber}
            onChange={(e) => patch({ cardNumber: e.target.value })}
            placeholder="123"
          />
          {!value.cardNumber ? (
            <span className="hint warn">
              Padrão recomendado: incluir o identificador do card.
            </span>
          ) : null}
        </label>

        <label>
          Slug
          <input
            value={value.slug}
            onChange={(e) =>
              patch({ slug: generateSlug(e.target.value) || e.target.value })
            }
          />
        </label>

        <label>
          Nome final da branch
          <input
            value={value.branchManual ? value.branchName : displayBranch}
            onChange={(e) => patch({ branchName: e.target.value })}
            disabled={!value.branchManual}
          />
        </label>
      </div>

      {value.tags.length > 0 ? (
        <div className="tags">
          {value.tags.map((tag) => (
            <span key={tag} className="badge">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <label className="checkbox">
        <input
          type="checkbox"
          checked={value.branchManual}
          onChange={(e) => patch({ branchManual: e.target.checked })}
        />
        Editar branch manualmente
      </label>

      {onAnalyze ? (
        <Button
          type="button"
          variant="ghost"
          onClick={onAnalyze}
          loading={analyzing}
        >
          Reanalisar com IA
        </Button>
      ) : null}
    </section>
  );
}
