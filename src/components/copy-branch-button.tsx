"use client";

import { Button } from "@/components/ui/button";
import { copyText, useToast } from "@/components/toast";

type Props = {
  branchName: string;
  compact?: boolean;
};

export function CopyBranchButton({ branchName, compact }: Props) {
  const { show, Toast } = useToast();

  return (
    <>
      <Button
        type="button"
        variant={compact ? "ghost" : "secondary"}
        size={compact ? "sm" : "md"}
        onClick={async () => {
          await copyText(branchName);
          show("Branch copiada!");
        }}
      >
        Copiar
      </Button>
      <Toast />
    </>
  );
}
