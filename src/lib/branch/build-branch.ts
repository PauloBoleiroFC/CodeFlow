import { generateSlug } from "./generate-slug";
import {
  DEFAULT_BRANCH_FORMAT,
  FALLBACK_BRANCH_TYPE,
  isBranchType,
  type BranchType,
} from "./types";

export type BuildBranchInput = {
  type: string;
  cardNumber?: string | null;
  slugSource: string;
  slug?: string;
  format?: string;
};

export type BuiltBranch = {
  type: BranchType;
  cardNumber: string | null;
  slug: string;
  branchName: string;
  format: string;
};

function sanitizeCardNumber(value?: string | null): string | null {
  if (!value) return null;
  const cleaned = value.trim().replace(/[^a-zA-Z0-9_-]/g, "");
  return cleaned.length > 0 ? cleaned : null;
}

export function buildBranchName(input: BuildBranchInput): BuiltBranch {
  const format = input.format?.trim() || DEFAULT_BRANCH_FORMAT;
  const type = isBranchType(input.type) ? input.type : FALLBACK_BRANCH_TYPE;
  const cardNumber = sanitizeCardNumber(input.cardNumber);
  const slug = generateSlug(input.slug ?? input.slugSource);

  if (!slug) {
    throw new Error("Slug inválido: informe um título ou resumo para a branch.");
  }

  let branchName = format
    .replaceAll("{tipo}", type)
    .replaceAll("{num-task}", cardNumber ?? "")
    .replaceAll("{slug}", slug);

  // When card number is absent, collapse empty segment: feature/-slug or feature/-slug → feature/slug
  branchName = branchName
    .replace(/\/-+/g, "/")
    .replace(/-+$/g, "")
    .replace(/\/+/g, "/")
    .replace(/-+/g, "-");

  // Handle formats like feature/{num}-{slug} becoming feature/-slug
  branchName = branchName.replace(/\/-/g, "/").replace(/-\//g, "/");

  return {
    type,
    cardNumber,
    slug,
    branchName,
    format,
  };
}

export function sanitizeBranchName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9/_-]+/g, "")
    .replace(/\/+/g, "/")
    .replace(/-+/g, "-")
    .replace(/\/-/g, "/")
    .replace(/-\//g, "/")
    .replace(/^[-/]+|[-/]+$/g, "");
}
