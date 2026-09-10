import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { tagsFromJson } from "@/lib/wiki";
import { prisma } from "@/lib/prisma";
import { DeleteWikiButton } from "@/components/delete-wiki-button";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

export default async function WikiArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await prisma.wikiArticle.findUnique({ where: { id } });
  if (!article) notFound();

  const tags = tagsFromJson(article.tagsJson);
  const project = article.projectId
    ? await prisma.project.findUnique({ where: { id: article.projectId } })
    : null;

  return (
    <main className="stack">
      <Link href="/wiki">← Voltar para wiki</Link>
      <PageHeader
        title={article.title}
        description={article.summary || undefined}
        actions={
          <>
            <ButtonLink
              href={`/wiki/${article.id}/edit`}
              variant="outline"
            >
              Editar
            </ButtonLink>
            <DeleteWikiButton articleId={article.id} title={article.title} />
          </>
        }
      />

      <div className="actions">
        {article.category ? (
          <span className="badge">{article.category}</span>
        ) : null}
        {project ? (
          <Link href={`/projects/${project.id}`} className="badge badge-neutral">
            {project.name}
          </Link>
        ) : null}
        {tags.map((tag) => (
          <Link
            key={tag}
            href={`/wiki?tag=${encodeURIComponent(tag)}`}
            className="badge badge-neutral"
          >
            {tag}
          </Link>
        ))}
      </div>

      <section className="panel">
        {article.content ? (
          <div
            className="prose-html"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        ) : (
          <p className="muted">Artigo sem conteúdo.</p>
        )}
      </section>

      <p className="hint">Atualizado em {formatDate(article.updatedAt)}</p>
    </main>
  );
}
