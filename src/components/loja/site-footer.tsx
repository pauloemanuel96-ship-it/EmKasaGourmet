import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteFooter() {
  return (
    <footer className="border-sand-200 bg-sand-200/50 mt-24 border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div className="flex flex-col gap-2">
          <p className="text-forest-900 font-serif text-xl">Emkasa Gourmet</p>
          <p className="text-ink-600 text-sm">
            Alimentar é uma forma de cuidar.
          </p>
          <ThemeToggle />
        </div>
        <nav aria-label="Rodapé" className="flex flex-col gap-2 text-sm">
          <Link href="/loja" className="text-ink-600 hover:text-forest-900">
            Loja
          </Link>
          <Link href="/box" className="text-ink-600 hover:text-forest-900">
            BOX e assinatura
          </Link>
          <Link href="/receitas" className="text-ink-600 hover:text-forest-900">
            Receitas
          </Link>
          <Link href="/escola" className="text-ink-600 hover:text-forest-900">
            Escola
          </Link>
          <Link href="/clube" className="text-ink-600 hover:text-forest-900">
            Clube
          </Link>
          <Link href="/admin" className="text-ink-600 hover:text-forest-900">
            Painel da equipe
          </Link>
        </nav>
        <p className="text-ink-600 text-xs">
          Protótipo de demonstração. Informações de alergênicos seguem a ficha
          técnica de cada produto; em caso de alergia grave, fale com a equipe
          antes de comprar.
        </p>
      </div>
    </footer>
  );
}
