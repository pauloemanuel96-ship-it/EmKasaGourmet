import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sem conexão",
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-start justify-center gap-4 px-6">
      <p className="text-leaf-700 text-xs font-medium tracking-widest uppercase">
        Sem conexão
      </p>
      <h1 className="text-3xl">Você está sem internet agora.</h1>
      <p className="text-ink-600">
        Preços e disponibilidade mudam ao longo do dia, por isso a loja só abre
        com conexão. Assim que a internet voltar, é só tentar de novo.
      </p>
      {/* Link comum de propósito: recarrega a página inteira. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/"
        className="bg-forest-900 text-cream-50 hover:bg-forest-700 flex min-h-11 items-center rounded-(--radius-control) px-6 font-medium"
      >
        Tentar de novo
      </a>
    </main>
  );
}
