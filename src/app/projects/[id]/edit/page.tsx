import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/project-form";
import { DeleteProjectButton } from "@/components/delete-project-button";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      links: { orderBy: { createdAt: "asc" } },
      _count: { select: { tasks: true } },
    },
  });

  if (!project) notFound();

  return (
    <main className="stack">
      <PageHeader
        title="Editar projeto"
        description={`Atualize os dados de ${project.name}.`}
      />
      <Link href={`/projects/${project.id}`}>← Voltar ao projeto</Link>

      <ProjectForm
        mode="edit"
        initial={{
          id: project.id,
          name: project.name,
          slug: project.slug,
          description: project.description ?? "",
          observations: project.observations ?? "",
          links: project.links.map((l) => ({
            id: l.id,
            name: l.name,
            url: l.url,
          })),
        }}
      />

      <section className="panel stack">
        <h2 className="section-title">Zona de risco</h2>
        <p className="muted">
          Excluir remove o projeto. As tarefas vinculadas permanecem sem projeto.
        </p>
        <DeleteProjectButton
          projectId={project.id}
          projectName={project.name}
          taskCount={project._count.tasks}
        />
      </section>
    </main>
  );
}
