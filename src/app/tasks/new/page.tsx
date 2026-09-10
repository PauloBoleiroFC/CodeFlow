import Link from "next/link";
import { TaskCreateForm } from "@/components/task-create-form";
import { PageHeader } from "@/components/ui/page-header";

export default function NewTaskPage() {
  return (
    <main className="stack">
      <PageHeader
        title="Nova tarefa"
        description="Vínculo com projeto é opcional. Branch e contexto seguem o padrão do sistema."
      />
      <Link href="/tasks">← Voltar para tarefas</Link>
      <TaskCreateForm />
    </main>
  );
}
