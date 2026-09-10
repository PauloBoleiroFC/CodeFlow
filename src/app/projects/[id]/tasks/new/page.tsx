import Link from "next/link";
import { notFound } from "next/navigation";
import { TaskCreateForm } from "@/components/task-create-form";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  return (
    <main className="stack">
      <PageHeader
        title="Nova tarefa"
        description={`Projeto ${project.name} já selecionado — você pode alterar ou remover o vínculo.`}
      />
      <Link href={`/projects/${project.id}`}>← Voltar ao projeto</Link>
      <TaskCreateForm initialProjectId={project.id} />
    </main>
  );
}
