"use client";

import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  taskStatusDotClass,
  type TaskStatus,
} from "@/lib/task-status";

type Props = {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
};

export function TaskStatusSelect({
  value,
  onChange,
  disabled,
  id,
  "aria-label": ariaLabel = "Status da tarefa",
}: Props) {
  return (
    <div className="status-select-wrap">
      <span
        className={taskStatusDotClass(value)}
        aria-hidden
        title={TASK_STATUS_LABELS[value]}
      />
      <select
        id={id}
        className="status-select"
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value as TaskStatus)}
        onClick={(e) => e.stopPropagation()}
      >
        {TASK_STATUSES.map((status) => (
          <option key={status} value={status}>
            {TASK_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </div>
  );
}
