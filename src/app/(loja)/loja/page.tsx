import type { Metadata } from "next";
import { Suspense } from "react";
import { Catalog } from "@/components/loja/catalog";
import { getStoreCatalog } from "@/modules/catalogo/store";

export const metadata: Metadata = { title: "Loja" };

export default async function LojaPage() {
  const catalog = await getStoreCatalog();
  const products = catalog.products.filter((p) => p.channel === "loja");
  return (
    <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <h1 className="text-4xl">Loja</h1>
      <p className="text-ink-600 mt-2">
        Horta, cozinha e produtos da casa num carrinho só.
      </p>
      <Suspense
        fallback={<p className="text-ink-600 mt-8">Carregando catálogo…</p>}
      >
        <Catalog products={products} sections={catalog.sections} />
      </Suspense>
    </main>
  );
}
