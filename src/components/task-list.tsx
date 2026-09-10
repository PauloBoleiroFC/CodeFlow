"use client";

import { ClipboardList } from "lucide-react";
import { CopyBranchButton } from "@/components/copy-branch-button";
import { BranchTypeBadge } from "@/components/ui/branch-type-badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";

export type TaskListItem = {
  id: string;
  title: string;
  branchName: string;
  branchType: string;
  cardNumber: string | null;
  updatedAt: string;
};

type Props = {
  projectId: string;
  tasks: TaskListItem[];
};

export function TaskList({ projectId, tasks }: Props) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Nenhuma tarefa neste projeto"
        description="Crie a primeira tarefa para gerar branch e histórico."
        action={
          <ButtonLink
            href={`/projects/${projectId}/tasks/new`}
            size="sm"
          >
            + Nova tarefa
          </ButtonLink>
        }
      />
    );
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li key={task.id} className="task-row">
          <div>
            <Link href={`/projects/${projectId}/tasks/${task.id}`}>
              {task.title}
            </Link>
            <p className="branch-inline">
              <BranchTypeBadge type={task.branchType} />
              <code>{task.branchName}</code>
            </p>
          </div>
          <div className="list-actions">
            <CopyBranchButton branchName={task.branchName} compact />
          </div>
        </li>
      ))}
    </ul>
  );
}
