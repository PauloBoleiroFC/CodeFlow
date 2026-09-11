"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "normal" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "normal",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      disableClose={loading}
    >
      <div className="actions" style={{ justifyContent: "flex-end" }}>
        <Button
          ref={cancelRef}
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={variant === "danger" ? "danger" : "success"}
          loading={loading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
