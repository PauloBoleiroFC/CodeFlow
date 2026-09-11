"use client";

import { type FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatApiError } from "@/lib/branch";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("paulo@codeflow.local");
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
      router.replace(next.startsWith("/") ? next : "/");
      router.refresh();
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
      </form>
    </main>
  );
}
