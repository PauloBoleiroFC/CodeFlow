import { FolderKanban, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { ProjectCardActions } from "@/components/project-card-actions";
import { summarizeHtml } from "@/lib/task-paths";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(value);
}

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { tasks: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Projetos"
        description="Organize contexto técnico, links e tarefas por projeto."
        actions={
          <ButtonLink href="/projects/new" leftIcon={<Plus size={16} />}>
            Novo projeto
          </ButtonLink>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Nenhum projeto cadastrado"
          description="Crie um projeto para agrupar tarefas e preservar contexto."
          action={
            <ButtonLink href="/projects/new">+ Novo projeto</ButtonLink>
          }
        />
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <article key={project.id} className="project-card">
              <Link
                href={`/projects/${project.id}`}
                className="project-card-main"
              >
                <p className="eyebrow">{project.slug}</p>
                <h2>{project.name}</h2>
                <p className="muted">
                  {summarizeHtml(project.description) || "Sem descrição"}
                </p>
                <p className="hint">
                  {project._count.tasks} tarefa
                  {project._count.tasks === 1 ? "" : "s"} · atualizado em{" "}
                  {formatDate(project.updatedAt)}
                </p>
              </Link>
              <ProjectCardActions
                projectId={project.id}
                projectName={project.name}
                taskCount={project._count.tasks}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
