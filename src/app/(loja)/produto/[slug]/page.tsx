import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/loja/add-to-cart";
import { AllergenBlock } from "@/components/loja/allergen-block";
import { LivePrice } from "@/components/loja/live-price";
import { ProductArt } from "@/components/loja/product-art";
import {
  DIET_LABEL,
  PRODUCTS,
  RECIPES,
  STORAGE_LABEL,
  UNIT_LABEL,
  productBySlug,
} from "@/demo/data";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/produto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = productBySlug(slug);
  return { title: p?.name ?? "Produto" };
}

export default async function ProdutoPage({
  params,
}: PageProps<"/produto/[slug]">) {
  const { slug } = await params;
  const p = productBySlug(slug);
  if (!p) notFound();
  const recipes = RECIPES.filter((r) => r.products.includes(p.slug));

  return (
    <main className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <nav aria-label="Trilha" className="text-ink-600 mb-6 text-sm">
        <Link href="/loja" className="hover:underline">
          Loja
        </Link>{" "}
        /{" "}
        <Link href={`/loja?unidade=${p.unit}`} className="hover:underline">
          {UNIT_LABEL[p.unit]}
        </Link>{" "}
        / {p.name}
      </nav>
      <div className="grid gap-10 md:grid-cols-2">
        <ProductArt name={p.name} tone={p.tone} />
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-leaf-500 text-xs font-medium tracking-widest uppercase">
              {p.category}
            </p>
            <h1 className="text-4xl">{p.name}</h1>
            <p className="text-ink-600">{p.unitLabel}</p>
            <LivePrice slug={p.slug} />
          </div>
          <p className="text-ink-900">{p.description}</p>
          {p.diet.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Alimentação">
              {p.diet.map((d) => (
                <li
                  key={d}
                  className="border-leaf-500/50 text-forest-700 rounded border px-2 py-1 text-xs"
                >
                  {DIET_LABEL[d]}
                </li>
              ))}
            </ul>
          )}
          <AddToCart slug={p.slug} />
          <AllergenBlock product={p} />
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="font-medium">Ingredientes</dt>
              <dd className="text-ink-600">{p.ingredients.join(", ")}</dd>
            </div>
            <div>
              <dt className="font-medium">Conservação</dt>
              <dd className="text-ink-600">
                {STORAGE_LABEL[p.storage]}. {p.conservation}
              </dd>
            </div>
            {p.origin && (
              <div>
                <dt className="font-medium">Origem</dt>
                <dd className="text-ink-600">{p.origin}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      {recipes.length > 0 && (
        <section aria-labelledby="receitas-relacionadas" className="mt-16">
          <h2 id="receitas-relacionadas" className="mb-4 text-2xl">
            Receitas com {p.name.toLowerCase()}
          </h2>
          <ul className="flex flex-col gap-2">
            {recipes.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/receitas/${r.slug}`}
                  className="text-forest-700 underline underline-offset-4"
                >
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
