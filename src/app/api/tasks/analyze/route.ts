import { NextResponse } from "next/server";
import { z } from "zod";
import { BRANCH_TYPES } from "@/lib/branch";
import { analyzeTask } from "@/lib/analyze-task";

const bodySchema = z.object({
  text: z.string().min(1),
  projectId: z.string().nullable().optional(),
  cardNumber: z.string().nullable().optional(),
  userBranchType: z.enum(BRANCH_TYPES).nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const result = await analyzeTask(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao analisar tarefa";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
