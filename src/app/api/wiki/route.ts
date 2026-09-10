import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  resolveWikiSlug,
  tagsFromJson,
  tagsToJson,
  wikiArticleSchema,
} from "@/lib/wiki";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const category = searchParams.get("category")?.trim() ?? "";

  const articles = await prisma.wikiArticle.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const filtered = articles.filter((article) => {
    const tags = tagsFromJson(article.tagsJson);
    const haystack = [
      article.title,
      article.summary,
      article.category ?? "",
      ...tags,
    ]
      .join(" ")
      .toLowerCase();
    const matchesQ = !q || haystack.includes(q);
    const matchesCategory =
      !category || (article.category ?? "").toLowerCase() === category.toLowerCase();
    return matchesQ && matchesCategory;
  });

  return NextResponse.json(
    filtered.map((article) => ({
      ...article,
      tags: tagsFromJson(article.tagsJson),
    })),
  );
}

export async function POST(request: Request) {
  const parsed = wikiArticleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const slug = resolveWikiSlug(body.title, body.slug);
  if (!slug) {
    return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
  }

  const existing = await prisma.wikiArticle.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: "Já existe um artigo com este slug." },
      { status: 409 },
    );
  }

  if (body.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
    });
    if (!project) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
    }
  }

  const article = await prisma.wikiArticle.create({
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

  return NextResponse.json(
    { ...article, tags: body.tags ?? [] },
    { status: 201 },
  );
}
