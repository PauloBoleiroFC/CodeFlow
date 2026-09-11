import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="login-page">Carregando...</main>}>
      <LoginForm />
    </Suspense>
  );
}
