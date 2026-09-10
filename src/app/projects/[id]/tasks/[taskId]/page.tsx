import Link from "next/link";
import { notFound } from "next/navigation";
import { TaskDetailClient } from "@/components/task-detail-client";
import { tagsFromJson } from "@/lib/analyze-task";
import { prisma } from "@/lib/prisma";
import { resolveBranchFormat } from "@/lib/task-service";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id, taskId } = await params;
  const [task, globalBranchFormat] = await Promise.all([
    prisma.task.findFirst({
      where: { id: taskId, projectId: id },
      include: {
        project: true,
        events: { orderBy: { createdAt: "desc" } },
      },
    }),
    resolveBranchFormat(),
  ]);

  if (!task) notFound();

  return (
    <main className="stack">
      <Link href="/tasks">← Voltar para tarefas</Link>
      <TaskDetailClient
        globalBranchFormat={globalBranchFormat}
        task={{
          id: task.id,
          title: task.title,
          summary: task.summary,
          cardNumber: task.cardNumber,
          status: task.status,
          branchType: task.branchType,
          suggestedBranchType: task.suggestedBranchType,
          branchTypeReason: task.branchTypeReason,
          slug: task.slug,
          branchName: task.branchName,
          branchManual: task.branchManual,
          tags: tagsFromJson(task.tagsJson),
          projectId: task.projectId,
          project: task.project
            ? {
                id: task.project.id,
                name: task.project.name,
              }
            : null,
          events: task.events.map((event) => ({
            id: event.id,
            type: event.type,
            previousValue: event.previousValue,
            newValue: event.newValue,
            userName: event.userName,
            createdAt: event.createdAt.toISOString(),
          })),
        }}
      />
    </main>
  );
}
