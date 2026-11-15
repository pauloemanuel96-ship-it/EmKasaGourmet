import type { Metadata } from "next";
import { COURSES } from "@/demo/data";
import { formatCents } from "@/lib/money";

export const metadata: Metadata = { title: "Escola" };

export default function EscolaPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
      <p className="text-leaf-700 text-xs font-medium tracking-widest uppercase">
        Emkasa Escola
      </p>
      <h1 className="mb-3 text-4xl">Aprenda com a Chef Angela</h1>
      <p className="text-ink-600 mb-10 max-w-prose">
        Cursos, oficinas e conteúdos gratuitos para cozinhar melhor em casa. A
        área de alunos chega numa fase futura do projeto.
      </p>
      <ul className="grid gap-6 md:grid-cols-3">
        {COURSES.map((c) => (
          <li
            key={c.slug}
            className="bg-paper flex flex-col gap-3 rounded-(--radius-media) p-6"
          >
            <p className="text-leaf-700 text-xs font-medium tracking-wide uppercase">
              {c.format}
            </p>
            <h2 className="text-xl">{c.title}</h2>
            <p className="text-ink-600 flex-1 text-sm">{c.summary}</p>
            <p className="text-terracotta-500 font-medium">
              {c.priceCents === null ? "Gratuito" : formatCents(c.priceCents)}
            </p>
            <span className="bg-sand-200 text-ink-600 rounded-(--radius-control) px-4 py-2 text-center text-sm">
              Inscrições em breve
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
