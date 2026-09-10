import Link from "next/link";
import { WikiArticleForm } from "@/components/wiki-article-form";
import { PageHeader } from "@/components/ui/page-header";

export default async function NewWikiArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;

  return (
    <main className="stack">
      <PageHeader
        title="Novo artigo"
        description="Documente conhecimento técnico reutilizável."
      />
      <Link href={projectId ? `/projects/${projectId}` : "/wiki"}>
        ← Voltar
      </Link>
      <WikiArticleForm
        mode="create"
        initial={
          projectId
            ? {
                title: "",
                slug: "",
                summary: "",
                content: "",
                category: "",
                tags: [],
                projectId,
              }
            : undefined
        }
      />
    </main>
  );
}
