"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatApiError } from "@/lib/branch";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("A senha e a confirmação não são iguais.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(formatApiError(data.error, "Falha ao cadastrar"));
      }
      // Full reload so the session cookie is applied on the next request
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card panel stack" onSubmit={onSubmit}>
        <div>
          <p className="eyebrow">
            <span className="brand-code" style={{ color: "var(--ink)" }}>
              Code
            </span>{" "}
            <span className="brand-flow">Flow</span>
          </p>
          <h1 className="section-title" style={{ fontSize: "1.5rem" }}>
            Criar conta
          </h1>
          <p className="muted">Cadastre-se para acessar o painel.</p>
        </div>

        <label>
          Nome
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
          />
        </label>

        <label>
          E-mail
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>

        <label>
          Confirmar senha
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <Button type="submit" variant="success" loading={loading}>
          Cadastrar
        </Button>

        <p className="muted" style={{ margin: 0, textAlign: "center" }}>
          Já tem conta?{" "}
          <Link href="/login">Entrar</Link>
        </p>
      </form>
    </main>
  );
}
