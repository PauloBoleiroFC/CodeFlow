import { NextResponse } from "next/server";
import { z } from "zod";
import { generateSlug } from "@/lib/branch";
import { prisma } from "@/lib/prisma";
import { projectLinkInputSchema } from "@/lib/project-validation";
import { syncProjectLinks } from "@/lib/task-service";

const projectPatchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  slug: z.string().trim().min(1).max(80).optional(),
  description: z.string().max(20000).nullable().optional(),
  observations: z.string().max(20000).nullable().optional(),
  branchFormat: z.string().max(120).nullable().optional(),
  links: z.array(projectLinkInputSchema).max(50).optional(),
});

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[id]">,
) {
  const { id } = await ctx.params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      links: { orderBy: { createdAt: "asc" } },
      tasks: {
        orderBy: { updatedAt: "desc" },
        include: {
          events: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
      _count: { select: { tasks: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ...project,
    taskCount: project._count.tasks,
    tasks: project.tasks.map((task) => ({
      ...task,
      tags: JSON.parse(task.tagsJson) as string[],
    })),
  });
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/projects/[id]">,
) {
  const { id } = await ctx.params;
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }

  const parsed = projectPatchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const body = parsed.data;
  let nextSlug = existing.slug;
  if (body.slug !== undefined) {
    nextSlug = generateSlug(body.slug);
    if (!nextSlug) {
      return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
    }
    if (nextSlug !== existing.slug) {
      const conflict = await prisma.project.findUnique({
        where: { slug: nextSlug },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "Já existe um projeto com este slug." },
          { status: 409 },
        );
      }
    }
  }

  await prisma.project.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.slug !== undefined ? { slug: nextSlug } : {}),
      ...(body.description !== undefined
        ? { description: body.description?.trim() || null }
        : {}),
      ...(body.observations !== undefined
        ? { observations: body.observations?.trim() || null }
        : {}),
      ...(body.branchFormat !== undefined
        ? { branchFormat: body.branchFormat?.trim() || null }
        : {}),
    },
  });

  if (body.links) {
    await syncProjectLinks(id, body.links);
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      links: { orderBy: { createdAt: "asc" } },
      _count: { select: { tasks: true } },
    },
  });

  return NextResponse.json({
    ...project,
    taskCount: project?._count.tasks ?? 0,
  });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/projects/[id]">,
) {
  const { id } = await ctx.params;
  const existing = await prisma.project.findUnique({
    where: { id },
    include: { _count: { select: { tasks: true } } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.task.updateMany({
      where: { projectId: id },
      data: { projectId: null },
    }),
    prisma.project.delete({ where: { id } }),
  ]);

  return NextResponse.json({
    ok: true,
    deletedId: id,
    unlinkedTasks: existing._count.tasks,
  });
}
