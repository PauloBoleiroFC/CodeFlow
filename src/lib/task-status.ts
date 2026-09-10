export const TASK_STATUSES = [
  "development",
  "homologation",
  "blocked",
  "cancelled",
  "finished",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  development: "Em desenvolvimento",
  homologation: "Em homologação",
  blocked: "Bloqueado",
  cancelled: "Cancelado",
  finished: "Finalizado",
};

export const DEFAULT_TASK_STATUS: TaskStatus = "development";

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

export function taskStatusBadgeClass(status: TaskStatus): string {
  switch (status) {
    case "development":
      return "badge";
    case "homologation":
      return "badge badge-neutral";
    case "blocked":
      return "badge badge-warning";
    case "cancelled":
      return "badge badge-danger";
    case "finished":
      return "badge badge-success";
    default:
      return "badge badge-neutral";
  }
}

export function taskStatusDotClass(status: TaskStatus): string {
  switch (status) {
    case "development":
      return "status-dot status-dot-development";
    case "homologation":
      return "status-dot status-dot-homologation";
    case "blocked":
      return "status-dot status-dot-blocked";
    case "cancelled":
      return "status-dot status-dot-cancelled";
    case "finished":
      return "status-dot status-dot-finished";
    default:
      return "status-dot";
  }
}
