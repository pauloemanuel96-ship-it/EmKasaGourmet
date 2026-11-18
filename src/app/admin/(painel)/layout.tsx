import { Suspense } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { signOut } from "@/modules/auth/actions";
import { ROLE_LABEL, getCurrentUser } from "@/modules/auth/staff";

/** Menu do papel de quem entrou, com o nome do papel ao lado. */
async function RoleNav() {
  const user = await getCurrentUser();
  return (
    <div className="flex items-center gap-2">
      {user?.role && (
        <span className="text-leaf-700 hidden shrink-0 px-2 text-xs font-semibold tracking-widest uppercase sm:inline">
          {ROLE_LABEL[user.role]}
        </span>
      )}
      <AdminNav role={user?.role ?? null} />
    </div>
  );
}

export default function PainelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="bg-cream-50 flex min-h-full flex-1 flex-col">
      <header className="border-sand-200 bg-paper/95 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2">
          <Link href="/admin" className="text-forest-900 font-serif text-lg">
            Painel Emkasa
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-ink-600 text-sm underline">
              Ver loja
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-ink-600 min-h-11 px-2 text-sm underline"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-2 pb-2">
          <Suspense fallback={<div className="h-11" />}>
            <RoleNav />
          </Suspense>
        </div>
      </header>
      <p className="bg-sand-200 text-ink-600 px-4 py-1.5 text-center text-xs">
        Produtos e Categorias gravam no banco. Hoje, Pedidos e Assistente ainda
        são demonstração (dados fictícios neste navegador).
      </p>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
