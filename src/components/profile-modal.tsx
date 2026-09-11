"use client";

import { type FormEvent, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { SessionUser } from "@/lib/auth-client";
import { formatApiError } from "@/lib/branch";

function ProfileForm({
  user,
  onSaved,
  onCancel,
}: {
  user: SessionUser;
  onSaved: (user: SessionUser) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword || confirmPassword || currentPassword) {
      if (newPassword !== confirmPassword) {
        setError("A nova senha e a confirmação não são iguais.");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
          confirmPassword: confirmPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(formatApiError(data.error, "Não foi possível salvar"));
      }
      onSaved(data as SessionUser);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Perfil atualizado com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <label>
        Nome
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
          autoComplete="name"
        />
      </label>

      <p
        className="section-title"
        style={{ fontSize: "0.95rem", marginTop: "0.35rem" }}
      >
        Alterar senha
      </p>
      <p className="hint" style={{ marginTop: "-0.35rem" }}>
        Preencha apenas se quiser trocar a senha.
      </p>

      <label>
        Senha atual
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />
      </label>
      <label>
        Nova senha
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
      </label>
      <label>
        Confirmar nova senha
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
      </label>

      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="hint memory">{success}</p> : null}

      <div className="actions" style={{ justifyContent: "flex-end" }}>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button type="submit" variant="success" loading={saving}>
          Salvar perfil
        </Button>
      </div>
    </form>
  );
}

export function ProfileModal() {
  const {
    user,
    profileOpen,
    profileNonce,
    closeProfile,
    applyUser,
  } = useAuth();

  return (
    <Modal
      open={profileOpen}
      onClose={closeProfile}
      title="Meu perfil"
      description="Atualize seu nome e, se desejar, a senha de acesso."
      size="md"
    >
      {user ? (
        <ProfileForm
          key={profileNonce}
          user={user}
          onSaved={applyUser}
          onCancel={closeProfile}
        />
      ) : null}
    </Modal>
  );
}
