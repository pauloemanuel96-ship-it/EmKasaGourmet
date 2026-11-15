import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Entrar no painel",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <p className="text-leaf-700 text-sm font-medium tracking-widest uppercase">
          Painel Emkasa
        </p>
        <h1 className="text-3xl">Entrar</h1>
        <p className="text-ink-600">
          Enviamos um link de acesso para o seu e-mail. Sem senha para lembrar.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
