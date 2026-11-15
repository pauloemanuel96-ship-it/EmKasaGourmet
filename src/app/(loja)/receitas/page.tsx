import type { Metadata } from "next";
import Link from "next/link";
import { ProductArt } from "@/components/loja/product-art";
import { RECIPES } from "@/demo/data";

export const metadata: Metadata = { title: "Receitas" };

export default function ReceitasPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <p className="text-leaf-500 text-xs font-medium tracking-widest uppercase">
        Alimentação na prática
      </p>
      <h1 className="mb-8 text-4xl">Receitas da Chef</h1>
      <ul className="grid gap-8 md:grid-cols-3">
        {RECIPES.map((r) => (
          <li key={r.slug}>
            <Link
              href={`/receitas/${r.slug}`}
              className="group flex flex-col gap-3"
            >
              <ProductArt name={r.title} tone={r.tone} ratio="3/2" />
              <p className="font-medium group-hover:underline">{r.title}</p>
              <p className="text-ink-600 text-sm">{r.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
