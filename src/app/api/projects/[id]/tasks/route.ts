import { NextResponse } from "next/server";
import { z } from "zod";
import { BRANCH_TYPES } from "@/lib/branch";
import { createTaskRecord } from "@/lib/task-service";
import { prisma } from "@/lib/prisma";

const createTaskSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional().default(""),
  cardNumber: z.string().nullable().optional(),
  branchType: z.enum(BRANCH_TYPES),
  suggestedBranchType: z.enum(BRANCH_TYPES).nullable().optional(),
  branchTypeReason: z.string().nullable().optional(),
  slug: z.string().min(1),
  branchName: z.string().min(1),
  branchManual: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
});

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[id]/tasks">,
) {
  const { id } = await ctx.params;
  const tasks = await prisma.task.findMany({
    where: { projectId: id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(
    tasks.map((task) => ({
      ...task,
      tags: JSON.parse(task.tagsJson) as string[],
    })),
  );
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/projects/[id]/tasks">,
) {
  const { id: projectId } = await ctx.params;
  const parsed = createTaskSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.message },
      { status: 400 },
    );
  }

  try {
    const task = await createTaskRecord({
      ...parsed.data,
      projectId,
    });
    return NextResponse.json(
      { ...task, tags: parsed.data.tags },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao criar tarefa";
    const status = message.includes("não encontrado") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
