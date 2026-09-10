import Link from "next/link";
import { notFound } from "next/navigation";
import { WikiArticleForm } from "@/components/wiki-article-form";
import { PageHeader } from "@/components/ui/page-header";
import { tagsFromJson } from "@/lib/wiki";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditWikiArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await prisma.wikiArticle.findUnique({ where: { id } });
  if (!article) notFound();

  return (
    <main className="stack">
      <PageHeader
        title="Editar artigo"
        description={`Atualize “${article.title}”.`}
      />
      <Link href={`/wiki/${article.id}`}>← Voltar ao artigo</Link>
      <WikiArticleForm
        mode="edit"
        initial={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          content: article.content,
          category: article.category ?? "",
          tags: tagsFromJson(article.tagsJson),
          projectId: article.projectId ?? "",
        }}
      />
    </main>
  );
}
