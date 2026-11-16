import type { Metadata } from "next";
import { PasswordForm } from "@/components/loja/conta/password-form";

export const metadata: Metadata = {
  title: "Senha nova",
  robots: { index: false },
};

export default function SenhaPage() {
  return (
    <main className="mx-auto max-w-md px-4 pt-10 sm:px-6">
      <p className="text-leaf-700 text-xs font-medium tracking-widest uppercase">
        Minha Casa Emkasa
      </p>
      <h1 className="mb-6 text-4xl">Senha nova</h1>
      <div className="border-sand-200 bg-paper rounded-(--radius-media) border p-6 sm:p-8">
        <PasswordForm />
      </div>
    </main>
  );
}
