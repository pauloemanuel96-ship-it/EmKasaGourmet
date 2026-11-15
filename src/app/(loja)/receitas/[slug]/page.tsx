import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BuyIngredients } from "@/components/loja/buy-ingredients";
import { ProductArt } from "@/components/loja/product-art";
import { RECIPES } from "@/demo/data";

export function generateStaticParams() {
  return RECIPES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/receitas/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: RECIPES.find((r) => r.slug === slug)?.title ?? "Receita" };
}

export default async function ReceitaPage({
  params,
}: PageProps<"/receitas/[slug]">) {
  const { slug } = await params;
  const r = RECIPES.find((x) => x.slug === slug);
  if (!r) notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      <p className="text-leaf-500 text-xs font-medium tracking-widest uppercase">
        {r.minutes} min · {r.servings} porções
      </p>
      <h1 className="mb-6 text-4xl">{r.title}</h1>
      <ProductArt name={r.title} tone={r.tone} ratio="3/2" />
      <p className="text-ink-600 mt-6 text-lg">{r.summary}</p>
      <h2 className="mt-10 mb-4 text-2xl">Modo de preparo</h2>
      <ol className="flex list-decimal flex-col gap-3 pl-6">
        {r.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <BuyIngredients slugs={r.products} />
    </main>
  );
}
