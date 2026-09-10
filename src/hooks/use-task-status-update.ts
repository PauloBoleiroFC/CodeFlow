"use client";

import { useCallback, useState } from "react";
import { formatApiError } from "@/lib/branch";
import {
  isTaskStatus,
  type TaskStatus,
} from "@/lib/task-status";

export async function updateTaskStatusRequest(
  taskId: string,
  status: TaskStatus,
) {
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  const raw = await res.text();
  let data: { status?: string; error?: unknown } = {};
  if (raw) {
    try {
      data = JSON.parse(raw) as { status?: string; error?: unknown };
    } catch {
      throw new Error(
        res.ok
          ? "Resposta inválida do servidor ao atualizar status"
          : `Falha ao atualizar status (HTTP ${res.status})`,
      );
    }
  }

  if (!res.ok) {
    throw new Error(formatApiError(data.error, "Falha ao atualizar status"));
  }
  if (!isTaskStatus(data.status ?? "")) {
    throw new Error("Status inválido retornado pela API");
  }
  return data as { id: string; status: TaskStatus };
}

export function useTaskStatusUpdate(onUpdated?: (taskId: string, status: TaskStatus) => void) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      setPendingId(taskId);
      setError(null);
      try {
        const data = await updateTaskStatusRequest(taskId, status);
        onUpdated?.(taskId, data.status);
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao atualizar status";
        setError(message);
        throw err;
      } finally {
        setPendingId(null);
      }
    },
    [onUpdated],
  );

  return { updateStatus, pendingId, error, setError };
}
