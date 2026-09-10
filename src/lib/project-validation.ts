import { z } from "zod";

export const projectLinkInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome do link obrigatório").max(120),
  url: z
    .string()
    .min(1, "URL obrigatória")
    .url("URL inválida")
    .max(2000),
});

export const projectUpsertSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  slug: z.string().trim().min(1).max(80).optional(),
  description: z.string().max(20000).nullable().optional(),
  observations: z.string().max(20000).nullable().optional(),
  branchFormat: z.string().max(120).nullable().optional(),
  links: z.array(projectLinkInputSchema).max(50).optional().default([]),
});

export type ProjectLinkInput = z.infer<typeof projectLinkInputSchema>;
export type ProjectUpsertInput = z.infer<typeof projectUpsertSchema>;

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
