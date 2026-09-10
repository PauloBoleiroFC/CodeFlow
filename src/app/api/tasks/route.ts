import { NextResponse } from "next/server";
import { z } from "zod";
import { BRANCH_TYPES } from "@/lib/branch";
import { createTaskRecord } from "@/lib/task-service";
import { prisma } from "@/lib/prisma";

const createTaskSchema = z.object({
  projectId: z.string().nullable().optional(),
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

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      project: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(
    tasks.map((task) => ({
      ...task,
      tags: JSON.parse(task.tagsJson) as string[],
      projectName: task.project?.name ?? null,
    })),
  );
}

export async function POST(request: Request) {
  const parsed = createTaskSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.message },
      { status: 400 },
    );
  }

  try {
    const task = await createTaskRecord(parsed.data);
    return NextResponse.json(
      {
        ...task,
        tags: parsed.data.tags,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao criar tarefa";
    const status = message.includes("não encontrado") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
