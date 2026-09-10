import Link from "next/link";
import { ProjectForm } from "@/components/project-form";
import { PageHeader } from "@/components/ui/page-header";

export default function NewProjectPage() {
  return (
    <main className="stack">
      <PageHeader
        title="Novo projeto"
        description="Nome, descrição, observações e links de contexto."
      />
      <Link href="/projects">← Voltar</Link>
      <ProjectForm mode="create" />
    </main>
  );
}
