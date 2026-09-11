"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatApiError } from "@/lib/branch";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

type Props = {
  taskId: string;
  taskTitle: string;
  projectId?: string | null;
  compact?: boolean;
};

export function DeleteTaskButton({
  taskId,
  taskTitle,
  projectId,
  compact = false,
}: Props) {
  const router = useRouter();
  const { show, Toast } = useToast();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(formatApiError(data.error, "Falha ao excluir"));
      }
      show("Tarefa excluída com sucesso.");
      setOpen(false);
      const redirectTo = projectId ? `/projects/${projectId}` : "/tasks";
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
      setDeleting(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="danger"
        size={compact ? "sm" : "md"}
        loading={deleting}
        onClick={() => setOpen(true)}
      >
        {compact ? "Excluir" : "Excluir tarefa"}
      </Button>
      {error ? <p className="error">{error}</p> : null}
      <ConfirmModal
        open={open}
        title="Excluir tarefa"
        description={`Excluir "${taskTitle}"? O histórico da timeline também será removido. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
        loading={deleting}
        onConfirm={onConfirm}
        onCancel={() => {
          if (!deleting) setOpen(false);
        }}
      />
      <Toast />
    </div>
  );
}
