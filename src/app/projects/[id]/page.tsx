import { notFound } from "next/navigation";
import { ProjectDetailClient } from "@/components/project-detail-client";
import { tagsFromJson } from "@/lib/wiki";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, wikis] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        links: { orderBy: { createdAt: "asc" } },
        tasks: { orderBy: { updatedAt: "desc" } },
        _count: { select: { tasks: true } },
      },
    }),
    prisma.wikiArticle.findMany({
      where: { projectId: id },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  if (!project) notFound();

  return (
    <ProjectDetailClient
      project={{
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        observations: project.observations,
        links: project.links.map((link) => ({
          id: link.id,
          name: link.name,
          url: link.url,
        })),
        taskCount: project._count.tasks,
      }}
      tasks={project.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        branchName: task.branchName,
        branchType: task.branchType,
        cardNumber: task.cardNumber,
        status: task.status,
        updatedAt: task.updatedAt.toISOString(),
      }))}
      wikis={wikis.map((article) => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        category: article.category,
        tags: tagsFromJson(article.tagsJson),
        updatedAt: article.updatedAt.toISOString(),
      }))}
    />
  );
}
