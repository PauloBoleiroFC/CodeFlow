export const BRANCH_TYPES = [
  "feature",
  "fix",
  "bugfix",
  "hotfix",
  "task",
  "refactor",
  "chore",
  "docs",
  "test",
] as const;

export type BranchType = (typeof BRANCH_TYPES)[number];

export const BRANCH_TYPE_LABELS: Record<BranchType, string> = {
  feature: "Nova funcionalidade",
  fix: "Correção de bug",
  bugfix: "Correção de bug",
  hotfix: "Correção urgente em produção",
  task: "Tarefa técnica/manutenção",
  refactor: "Refatoração sem mudar comportamento",
  chore: "Configuração/manutenção",
  docs: "Documentação",
  test: "Criação/alteração de testes",
};

export const DEFAULT_BRANCH_FORMAT = "{tipo}/{num-task}-{slug}";
export const FALLBACK_BRANCH_TYPE: BranchType = "task";

export function isBranchType(value: string): value is BranchType {
  return (BRANCH_TYPES as readonly string[]).includes(value);
}
