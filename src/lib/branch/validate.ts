import { z } from "zod";
import { sanitizeBranchName } from "./build-branch";
import { generateSlug } from "./generate-slug";
import { BRANCH_TYPES, isBranchType } from "./types";

const branchTypeSchema = z.enum(BRANCH_TYPES);

export const aiAnalysisSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(2000).default(""),
  branchType: branchTypeSchema,
  slug: z.string().min(1).max(120),
  branchName: z.string().min(1).max(200),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  branchTypeReason: z.string().max(300).optional(),
  memoryMessage: z.string().max(500).optional(),
});

export type AiAnalysisResult = z.infer<typeof aiAnalysisSchema>;

/**
 * Sanitize first, then validate the normalized name.
 * Spaces/uppercase/special chars are auto-fixed (10.6), not hard errors.
 */
export function validateBranchName(branchName: string): {
  ok: boolean;
  sanitized: string;
  errors: string[];
} {
  const errors: string[] = [];
  const sanitized = sanitizeBranchName(branchName);

  if (!sanitized) {
    errors.push("Nome da branch vazio após sanitização.");
  } else if (!/^[a-z0-9]+(?:[/_-][a-z0-9]+)*$/.test(sanitized)) {
    // allow feature/123-slug pattern
    if (!/^[a-z0-9/_-]+$/.test(sanitized)) {
      errors.push("Branch contém caracteres inválidos após sanitização.");
    }
  }

  return {
    ok: errors.length === 0,
    sanitized,
    errors,
  };
}

export function formatApiError(error: unknown, fallback: string): string {
  if (typeof error === "string") return error;
  if (Array.isArray(error)) return error.filter(Boolean).join(" ");
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

/** Never trust AI output blindly — normalize before returning to the client. */
export function validateAiAnalysis(
  raw: unknown,
  context: {
    cardNumber?: string | null;
    format?: string;
  },
): AiAnalysisResult {
  const parsed = aiAnalysisSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Resposta da IA inválida: ${parsed.error.message}`);
  }

  const data = parsed.data;
  if (!isBranchType(data.branchType)) {
    throw new Error("Tipo de branch inválido na resposta da IA.");
  }

  const slug = generateSlug(data.slug || data.title);
  const validation = validateBranchName(data.branchName);
  if (!validation.ok) {
    const rebuilt = context.cardNumber
      ? `${data.branchType}/${context.cardNumber}-${slug}`
      : `${data.branchType}/${slug}`;
    const fallback = validateBranchName(rebuilt);
    if (!fallback.ok) {
      throw new Error(validation.errors.join(" "));
    }
    return {
      ...data,
      slug,
      branchName: fallback.sanitized,
      tags: data.tags.map((t) => generateSlug(t)).filter(Boolean),
    };
  }

  if (!validation.sanitized.includes(`${data.branchType}/`)) {
    const rebuilt = context.cardNumber
      ? `${data.branchType}/${context.cardNumber}-${slug}`
      : `${data.branchType}/${slug}`;
    return {
      ...data,
      slug,
      branchName: sanitizeBranchName(rebuilt),
      tags: data.tags.map((t) => generateSlug(t)).filter(Boolean),
    };
  }

  return {
    ...data,
    slug,
    branchName: validation.sanitized,
    tags: data.tags.map((t) => generateSlug(t)).filter(Boolean),
  };
}
