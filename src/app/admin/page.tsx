import type { Metadata } from "next";
import { Suspense } from "react";
import { ROLE_LABEL, requireStaff } from "@/modules/auth/staff";
import { signOut } from "@/modules/auth/actions";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export default function AdminHomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <Suspense fallback={<p className="text-ink-600">Carregando…</p>}>
        <AdminHome />
      </Suspense>
    </main>
  );
}

async function AdminHome() {
  const access = await requireStaff();

  if (!access.allowed) {
    return (
      <section className="flex flex-col gap-4" aria-labelledby="sem-acesso">
        <h1 id="sem-acesso" className="text-3xl">
          Sem acesso ao painel
        </h1>
        <p className="text-ink-600">
          Você entrou como {access.user.email ?? "usuário"}, mas esta conta
          ainda não tem um papel na equipe. Peça a liberação para a
          administração.
        </p>
        <SignOutButton />
      </section>
    );
  }

  const { user } = access;
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-leaf-500 text-sm font-medium tracking-widest uppercase">
            Painel Emkasa
          </p>
          <h1 className="text-3xl">Olá!</h1>
          <p className="text-ink-600">
            {user.email} · {ROLE_LABEL[user.role]}
          </p>
        </div>
        <SignOutButton />
      </header>
      <section aria-labelledby="em-breve" className="flex flex-col gap-2">
        <h2 id="em-breve" className="text-xl">
          Em construção
        </h2>
        <p className="text-ink-600">
          Próximas telas: Produtos (cadastro e edição) e Hoje (disponibilidade e
          estoque do dia).
        </p>
      </section>
    </>
  );
}

function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="border-forest-900 text-forest-900 hover:bg-sand-200 min-h-11 rounded-(--radius-control) border px-4 font-medium"
      >
        Sair
      </button>
    </form>
  );
}
