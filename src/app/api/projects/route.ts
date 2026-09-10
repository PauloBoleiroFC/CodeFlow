import { NextResponse } from "next/server";
import { generateSlug } from "@/lib/branch";
import { prisma } from "@/lib/prisma";
import { projectUpsertSchema } from "@/lib/project-validation";

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { tasks: true } },
      links: { orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json(
    projects.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      observations: p.observations,
      branchFormat: p.branchFormat,
      taskCount: p._count.tasks,
      updatedAt: p.updatedAt,
      links: p.links,
    })),
  );
}

export async function POST(request: Request) {
  const parsed = projectUpsertSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const slug = generateSlug(body.slug?.trim() || body.name);
  if (!slug) {
    return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
  }

  const existing = await prisma.project.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: "Já existe um projeto com este slug." },
      { status: 409 },
    );
  }

  const project = await prisma.project.create({
    data: {
      name: body.name.trim(),
      slug,
      description: body.description?.trim() || null,
      observations: body.observations?.trim() || null,
      branchFormat: body.branchFormat?.trim() || null,
      links: {
        create: (body.links ?? []).map((link) => ({
          name: link.name.trim(),
          url: link.url.trim(),
        })),
      },
    },
    include: {
      links: true,
      _count: { select: { tasks: true } },
    },
  });

  return NextResponse.json(
    { ...project, taskCount: project._count.tasks },
    { status: 201 },
  );
}
