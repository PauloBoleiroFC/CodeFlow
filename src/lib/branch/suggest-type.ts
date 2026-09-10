import {
  BRANCH_TYPE_LABELS,
  FALLBACK_BRANCH_TYPE,
  type BranchType,
} from "./types";

export type SuggestBranchTypeInput = {
  text: string;
  /** User already chose a type — always wins (priority 1). */
  userChoice?: BranchType | null;
  /** Optional project-level default preference (priority 2). */
  projectPreferredType?: BranchType | null;
  /** Historical hint from similar tasks (memory). */
  memoryHint?: {
    type: BranchType;
    message: string;
  } | null;
};

export type BranchTypeSuggestion = {
  type: BranchType;
  reason: string;
  source: "user" | "project" | "ai" | "memory" | "fallback";
  memoryMessage?: string;
};

function detectTypeFromText(text: string): BranchTypeSuggestion | null {
  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (
    /(producao|produção|urgente|critico|crítico|hotfix|checkout em producao)/.test(
      normalized,
    )
  ) {
    return {
      type: "hotfix",
      reason: "hotfix — parece correção urgente em produção.",
      source: "ai",
    };
  }

  if (
    /(documentacao|documentação|readme|docs|api doc)/.test(normalized) &&
    !/(implementar|adicionar funcionalidade)/.test(normalized)
  ) {
    return {
      type: "docs",
      reason: "docs — parece alteração de documentação.",
      source: "ai",
    };
  }

  if (/(teste|testes|coverage|unitario|unitário|e2e)/.test(normalized)) {
    return {
      type: "test",
      reason: "test — parece criação ou alteração de testes.",
      source: "ai",
    };
  }

  if (
    /(refator|refactor|melhorar estrutura|sem alterar comportamento|sem mudar comportamento)/.test(
      normalized,
    )
  ) {
    return {
      type: "refactor",
      reason: "refactor — parece refatoração sem mudança de comportamento.",
      source: "ai",
    };
  }

  if (
    /(dependencia|dependência|atualizar php|atualizar pacote|infra|ci\/cd|configurar|chore)/.test(
      normalized,
    )
  ) {
    return {
      type: "chore",
      reason: "chore — parece configuração ou manutenção técnica.",
      source: "ai",
    };
  }

  if (
    /(corrigir|correção|correcao|bug|erro|falha|quebr)/.test(normalized)
  ) {
    return {
      type: "fix",
      reason: "fix — parece correção de bug.",
      source: "ai",
    };
  }

  if (
    /(adicionar|criar|nova funcionalidade|exportar|implementar|feature)/.test(
      normalized,
    )
  ) {
    return {
      type: "feature",
      reason: "feature — parece ser uma nova funcionalidade.",
      source: "ai",
    };
  }

  if (
    /(indice|índice|coluna|migracao|migração|manutencao|manutenção|ajuste tecnico|ajuste técnico)/.test(
      normalized,
    )
  ) {
    return {
      type: "task",
      reason: "task — parece tarefa técnica ou manutenção.",
      source: "ai",
    };
  }

  return null;
}

/**
 * Priority:
 * 1. User manual choice
 * 2. Project-specific rule
 * 3. Clear AI detection (or memory hint when clear)
 * 4. Fallback: task
 */
export function suggestBranchType(
  input: SuggestBranchTypeInput,
): BranchTypeSuggestion {
  if (input.userChoice) {
    return {
      type: input.userChoice,
      reason: `${input.userChoice} — escolha do usuário.`,
      source: "user",
    };
  }

  if (input.projectPreferredType) {
    return {
      type: input.projectPreferredType,
      reason: `${input.projectPreferredType} — regra/configuração do projeto.`,
      source: "project",
      memoryMessage: input.memoryHint?.message,
    };
  }

  const ai = detectTypeFromText(input.text);
  if (ai) {
    return {
      ...ai,
      memoryMessage: input.memoryHint?.message,
    };
  }

  if (input.memoryHint) {
    return {
      type: input.memoryHint.type,
      reason: `${input.memoryHint.type} — baseado em tarefas semelhantes do projeto.`,
      source: "memory",
      memoryMessage: input.memoryHint.message,
    };
  }

  return {
    type: FALLBACK_BRANCH_TYPE,
    reason: `${FALLBACK_BRANCH_TYPE} — padrão quando o tipo não é claro (${BRANCH_TYPE_LABELS.task.toLowerCase()}).`,
    source: "fallback",
  };
}
