"use client";

import { ButtonLink } from "@/components/ui/button";
import { DeleteProjectButton } from "@/components/delete-project-button";

type Props = {
  projectId: string;
  projectName: string;
  taskCount: number;
};

export function ProjectCardActions({
  projectId,
  projectName,
  taskCount,
}: Props) {
  return (
    <div className="project-card-actions">
      <ButtonLink variant="ghost" size="sm" href={`/projects/${projectId}`}>
        Abrir
      </ButtonLink>
      <ButtonLink
        variant="ghost"
        size="sm"
        href={`/projects/${projectId}/edit`}
      >
        Editar
      </ButtonLink>
      <DeleteProjectButton
        projectId={projectId}
        projectName={projectName}
        taskCount={taskCount}
        compact
      />
    </div>
  );
}
