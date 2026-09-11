"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatApiError } from "@/lib/branch";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(formatApiError(data.error, "Falha ao entrar"));
      }
      const next = searchParams.get("next") || "/";
      const target = next.startsWith("/") ? next : "/";
      // Full reload so the session cookie is applied on the next request
      window.location.assign(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar");
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
            Entrar
          </h1>
          <p className="muted">Acesse o painel técnico.</p>
        </div>

        <label>
          E-mail
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <Button type="submit" variant="success" loading={loading}>
          Entrar
        </Button>

        <p className="muted" style={{ margin: 0, textAlign: "center" }}>
          Não tem conta?{" "}
          <Link href="/register">Criar conta</Link>
        </p>
      </form>
    </main>
  );
}
