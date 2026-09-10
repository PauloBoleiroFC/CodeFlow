import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  resolveWikiSlug,
  tagsFromJson,
  tagsToJson,
  wikiArticleSchema,
} from "@/lib/wiki";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/wiki/[id]">,
) {
  const { id } = await ctx.params;
  const article = await prisma.wikiArticle.findUnique({ where: { id } });
  if (!article) {
    return NextResponse.json({ error: "Artigo não encontrado" }, { status: 404 });
  }
  return NextResponse.json({
    ...article,
    tags: tagsFromJson(article.tagsJson),
  });
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/wiki/[id]">,
) {
  const { id } = await ctx.params;
  const existing = await prisma.wikiArticle.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Artigo não encontrado" }, { status: 404 });
  }

  const parsed = wikiArticleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const slug = resolveWikiSlug(body.title, body.slug ?? existing.slug);
  if (!slug) {
    return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
  }

  if (slug !== existing.slug) {
    const conflict = await prisma.wikiArticle.findUnique({ where: { slug } });
    if (conflict) {
      return NextResponse.json(
        { error: "Já existe um artigo com este slug." },
        { status: 409 },
      );
    }
  }

  if (body.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
    });
    if (!project) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
    }
  }

  const article = await prisma.wikiArticle.update({
    where: { id },
    data: {
      title: body.title.trim(),
      slug,
      summary: body.summary?.trim() || "",
      content: body.content || "",
      category: body.category?.trim() || null,
      tagsJson: tagsToJson(body.tags ?? []),
      projectId: body.projectId?.trim() || null,
    },
  });

  return NextResponse.json({
    ...article,
    tags: body.tags ?? [],
  });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/wiki/[id]">,
) {
  const { id } = await ctx.params;
  const existing = await prisma.wikiArticle.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Artigo não encontrado" }, { status: 404 });
  }

  await prisma.wikiArticle.delete({ where: { id } });
  return NextResponse.json({ ok: true, deletedId: id });
}
