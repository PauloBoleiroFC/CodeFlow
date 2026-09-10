"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatApiError } from "@/lib/branch";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

type Props = {
  projectId: string;
  projectName: string;
  taskCount: number;
  redirectTo?: string;
  compact?: boolean;
};

export function DeleteProjectButton({
  projectId,
  projectName,
  taskCount,
  redirectTo = "/projects",
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
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(formatApiError(data.error, "Falha ao excluir"));
      }
      show("Projeto excluído com sucesso.");
      setOpen(false);
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
        {compact ? "Excluir" : "Excluir projeto"}
      </Button>
      {error ? <p className="error">{error}</p> : null}
      <ConfirmModal
        open={open}
        title="Excluir projeto"
        description={
          taskCount > 0
            ? `Excluir "${projectName}"? As ${taskCount} tarefa(s) permanecerão no sistema sem projeto.`
            : `Excluir o projeto "${projectName}"? Esta ação não pode ser desfeita.`
        }
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
