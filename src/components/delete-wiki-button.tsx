"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatApiError } from "@/lib/branch";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

type Props = {
  articleId: string;
  title: string;
};

export function DeleteWikiButton({ articleId, title }: Props) {
  const router = useRouter();
  const { show, Toast } = useToast();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onConfirm() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/wiki/${articleId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(formatApiError(data.error, "Falha ao excluir"));
      }
      show("Artigo excluído com sucesso.");
      setOpen(false);
      router.push("/wiki");
      router.refresh();
    } catch (err) {
      setDeleting(false);
      show(err instanceof Error ? err.message : "Erro ao excluir");
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="danger"
        loading={deleting}
        onClick={() => setOpen(true)}
      >
        Excluir
      </Button>
      <ConfirmModal
        open={open}
        title="Excluir artigo"
        description={`Excluir o artigo "${title}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
        loading={deleting}
        onConfirm={onConfirm}
        onCancel={() => {
          if (!deleting) setOpen(false);
        }}
      />
      <Toast />
    </>
  );
}
