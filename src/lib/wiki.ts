import { z } from "zod";
import { generateSlug } from "@/lib/branch";

export const wikiArticleSchema = z.object({
  title: z.string().trim().min(2, "Título muito curto").max(160),
  slug: z.string().trim().max(120).optional(),
  summary: z.string().max(500).optional().default(""),
  content: z.string().max(100000).optional().default(""),
  category: z.string().trim().max(80).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]),
  projectId: z.string().nullable().optional(),
});

export type WikiArticleInput = z.infer<typeof wikiArticleSchema>;

export function resolveWikiSlug(title: string, slug?: string) {
  return generateSlug(slug?.trim() || title);
}

export function tagsToJson(tags: string[]) {
  return JSON.stringify(tags);
}

export function tagsFromJson(tagsJson: string): string[] {
  try {
    const parsed = JSON.parse(tagsJson) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((t): t is string => typeof t === "string")
      : [];
  } catch {
    return [];
  }
}
