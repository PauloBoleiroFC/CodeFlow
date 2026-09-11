import { NextResponse } from "next/server";
import { z } from "zod";
import {
  BRANCH_TYPES,
  buildBranchName,
  sanitizeBranchName,
  validateBranchName,
} from "@/lib/branch";
import { tagsToJson } from "@/lib/analyze-task";
import { resolveBranchFormat } from "@/lib/task-service";
import { TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/task-status";
import { prisma } from "@/lib/prisma";

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  summary: z.string().optional(),
  cardNumber: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  branchType: z.enum(BRANCH_TYPES).optional(),
  slug: z.string().min(1).optional(),
  branchName: z.string().min(1).optional(),
  branchManual: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  userName: z.string().optional(),
});

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/tasks/[id]">,
) {
  const { id } = await ctx.params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: { include: { links: true } },
      events: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    ...task,
    tags: JSON.parse(task.tagsJson) as string[],
  });
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/tasks/[id]">,
) {
  try {
    return await patchTask(request, ctx);
  } catch (error) {
    console.error("PATCH /api/tasks/[id]", error);
    const message =
      error instanceof Error ? error.message : "Falha ao atualizar tarefa";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function patchTask(
  request: Request,
  ctx: RouteContext<"/api/tasks/[id]">,
) {
  const { id } = await ctx.params;
  const existing = await prisma.task.findUnique({
    where: { id },
    include: { project: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }

  const parsed = updateTaskSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const data = parsed.data;

  // Fast path: status-only update
  if (
    data.status !== undefined &&
    data.title === undefined &&
    data.summary === undefined &&
    data.cardNumber === undefined &&
    data.projectId === undefined &&
    data.branchType === undefined &&
    data.slug === undefined &&
    data.branchName === undefined &&
    data.branchManual === undefined &&
    data.tags === undefined
  ) {
    if (data.status === existing.status) {
      return NextResponse.json({
        ...existing,
        tags: JSON.parse(existing.tagsJson) as string[],
      });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: data.status,
        events: {
          create: {
            type: "status_changed",
            previousValue:
              TASK_STATUS_LABELS[
                existing.status as keyof typeof TASK_STATUS_LABELS
              ] ?? existing.status,
            newValue: TASK_STATUS_LABELS[data.status],
            userName: data.userName ?? "Usuário",
          },
        },
      },
      include: {
        events: { orderBy: { createdAt: "desc" } },
        project: true,
      },
    });

    return NextResponse.json({
      ...task,
      tags: JSON.parse(task.tagsJson) as string[],
    });
  }

  let nextProjectId = existing.projectId;
  if (data.projectId !== undefined) {
    nextProjectId = data.projectId?.trim() || null;
    if (nextProjectId) {
      const project = await prisma.project.findUnique({
        where: { id: nextProjectId },
      });
      if (!project) {
        return NextResponse.json(
          { error: "Projeto não encontrado" },
          { status: 404 },
        );
      }
    }
  }

  const format = await resolveBranchFormat();
  const branchManual = data.branchManual ?? existing.branchManual;
  const nextTitle = data.title?.trim() ?? existing.title;
  const nextCard =
    data.cardNumber !== undefined
      ? data.cardNumber?.trim() || null
      : existing.cardNumber;
  const nextType =
    data.branchType ?? (existing.branchType as (typeof BRANCH_TYPES)[number]);
  const nextSlug = data.slug ?? existing.slug;
  const nextStatus = data.status ?? existing.status;

  let nextBranchName = data.branchName ?? existing.branchName;

  if (!branchManual) {
    const built = buildBranchName({
      type: nextType,
      cardNumber: nextCard,
      slugSource: nextTitle,
      slug: nextSlug,
      format,
    });
    nextBranchName = built.branchName;
  } else if (data.branchName) {
    const validation = validateBranchName(data.branchName);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.errors }, { status: 400 });
    }
    nextBranchName = sanitizeBranchName(validation.sanitized);
  }

  const branchChanged = nextBranchName !== existing.branchName;
  const projectChanged = nextProjectId !== existing.projectId;
  const statusChanged = nextStatus !== existing.status;

  const eventsToCreate: Array<{
    type: string;
    previousValue: string | null;
    newValue: string | null;
    userName: string;
  }> = [];

  if (branchChanged) {
    eventsToCreate.push({
      type: "branch_changed",
      previousValue: existing.branchName,
      newValue: nextBranchName,
      userName: data.userName ?? "Usuário",
    });
  }

  if (projectChanged) {
    const previousName = existing.project?.name ?? "Sem projeto";
    let nextName = "Sem projeto";
    if (nextProjectId) {
      const p = await prisma.project.findUnique({
        where: { id: nextProjectId },
      });
      nextName = p?.name ?? nextProjectId;
    }
    eventsToCreate.push({
      type: "project_changed",
      previousValue: previousName,
      newValue: nextName,
      userName: data.userName ?? "Usuário",
    });
  }

  if (statusChanged) {
    eventsToCreate.push({
      type: "status_changed",
      previousValue:
        TASK_STATUS_LABELS[
          existing.status as keyof typeof TASK_STATUS_LABELS
        ] ?? existing.status,
      newValue:
        TASK_STATUS_LABELS[nextStatus as keyof typeof TASK_STATUS_LABELS] ??
        nextStatus,
      userName: data.userName ?? "Usuário",
    });
  }

  const builtSlug = branchManual
    ? nextSlug
    : buildBranchName({
        type: nextType,
        cardNumber: nextCard,
        slugSource: nextTitle,
        slug: nextSlug,
        format,
      }).slug;

  const task = await prisma.task.update({
    where: { id },
    data: {
      projectId: nextProjectId,
      title: nextTitle,
      summary: data.summary ?? existing.summary,
      cardNumber: nextCard,
      status: nextStatus,
      branchType: nextType,
      slug: builtSlug,
      branchName: nextBranchName,
      branchManual,
      ...(data.tags ? { tagsJson: tagsToJson(data.tags) } : {}),
      ...(eventsToCreate.length > 0
        ? { events: { create: eventsToCreate } }
        : {}),
    },
    include: {
      events: { orderBy: { createdAt: "desc" } },
      project: true,
    },
  });

  return NextResponse.json({
    ...task,
    tags: JSON.parse(task.tagsJson) as string[],
  });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/tasks/[id]">,
) {
  const { id } = await ctx.params;
  const existing = await prisma.task.findUnique({
    where: { id },
    select: { id: true, projectId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }

  await prisma.task.delete({ where: { id } });

  return NextResponse.json({
    ok: true,
    deletedId: id,
    projectId: existing.projectId,
  });
}
