import { Suspense } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { signOut } from "@/modules/auth/actions";

export default function PainelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="bg-cream-50 flex min-h-full flex-1 flex-col">
      <header className="border-sand-200 sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
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
            <AdminNav />
          </Suspense>
        </div>
      </header>
      <p className="bg-sand-200 text-ink-600 px-4 py-1.5 text-center text-xs">
        Modo demonstração: dados fictícios salvos neste navegador.
      </p>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
