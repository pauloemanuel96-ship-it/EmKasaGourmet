import type { Metadata } from "next";
import Link from "next/link";
import { DemoTag } from "@/components/loja/demo-tag";
import { ProductImage } from "@/components/loja/product-image";
import { formatCents } from "@/lib/money";
import { getStoreCatalog } from "@/modules/catalogo/store";
import {
  whatsappLink,
  type StoreCategory,
  type StoreProduct,
} from "@/modules/catalogo/store-types";

export const metadata: Metadata = {
  title: "Encomendas e Confraternizações",
  description:
    "Ceia Natural Emkasa, Ceia Tradicional, confraternizações e datas especiais sob encomenda.",
};

function priceLine(p: StoreProduct) {
  if (p.priceCents === null) return "Sob orçamento";
  return `${p.quoteOnly ? "A partir de " : ""}${formatCents(p.priceCents)}`;
}

function OrderItem({ product }: { product: StoreProduct }) {
  return (
    <li>
      <Link href={`/produto/${product.slug}`} className="group flex gap-4">
        <div className="relative w-24 shrink-0 sm:w-28">
          <ProductImage product={product} sizes="112px" />
          {product.isDemo && <DemoTag className="absolute top-2 left-2" />}
        </div>
        <div className="flex flex-col gap-1 py-1">
          <p className="font-medium group-hover:underline">{product.name}</p>
          {product.short && (
            <p className="text-ink-600 text-sm">{product.short}</p>
          )}
          <p className="text-terracotta-500 text-sm font-medium">
            {priceLine(product)}
          </p>
        </div>
      </Link>
    </li>
  );
}

export default async function EncomendasPage() {
  const catalog = await getStoreCatalog();
  const section = catalog.sections.find((s) => s.channel === "encomendas");
  const products = catalog.products.filter((p) => p.channel === "encomendas");
  const byCategory = (c: StoreCategory) =>
    products.filter((p) => p.categorySlug === c.slug);
  const featured = section?.children.filter((c) => c.featured) ?? [];
  const others = section?.children.filter((c) => !c.featured) ?? [];
  const wa = whatsappLink(
    catalog.whatsapp,
    "Olá! Quero fazer uma encomenda com a Emkasa. Pode me ajudar?",
  );

  const cta = wa ? (
    <a
      href={wa}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-cream-50 text-forest-900 hover:bg-sand-200 inline-flex min-h-11 items-center rounded-(--radius-control) px-6 font-medium"
    >
      Pedir orçamento pelo WhatsApp
    </a>
  ) : (
    <p className="text-cream-50/80 text-sm">
      Os pedidos de orçamento abrem em breve.
    </p>
  );

  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <div className="bg-forest-900 text-cream-50 relative overflow-hidden rounded-(--radius-media) px-6 py-12 sm:px-12 sm:py-16">
          <div
            aria-hidden="true"
            className="bg-leaf-500/30 absolute -top-24 -right-20 size-80 rounded-full blur-3xl"
          />
          <div
            aria-hidden="true"
            className="bg-terracotta-500/25 absolute -bottom-24 -left-16 size-72 rounded-full blur-3xl"
          />
          <div className="relative flex max-w-2xl flex-col gap-5">
            <p className="text-cream-50/80 text-xs font-medium tracking-widest uppercase">
              Sob encomenda
            </p>
            <h1
              className="text-cream-50 text-3xl break-words hyphens-auto sm:text-5xl"
              lang="pt-BR"
            >
              {section?.name ?? "Encomendas e Confraternizações"}
            </h1>
            <p className="text-cream-50/85 text-lg">
              Ceias, confraternizações e datas especiais preparadas pela cozinha
              da Emkasa. Você escolhe, a gente monta o orçamento com você.
            </p>
            <div>{cta}</div>
          </div>
        </div>
      </section>

      {!section ? (
        <p className="text-ink-600 mx-auto mt-10 max-w-6xl px-4 sm:px-6">
          As encomendas estão fechadas no momento.
        </p>
      ) : (
        <>
          {featured.length > 0 && (
            <section
              aria-label="Ceias"
              className="mx-auto mt-12 grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-2"
            >
              {featured.map((c) => {
                const items = byCategory(c);
                return (
                  <article
                    key={c.slug}
                    className="border-sand-200 bg-paper flex flex-col gap-4 rounded-(--radius-media) border p-6 shadow-sm"
                  >
                    <p className="text-leaf-700 text-xs font-medium tracking-widest uppercase">
                      Em destaque
                    </p>
                    <h2 className="text-3xl">{c.name}</h2>
                    {c.description && (
                      <p className="text-ink-600">{c.description}</p>
                    )}
                    {items.length > 0 ? (
                      <ul className="mt-2 flex flex-col gap-4">
                        {items.map((p) => (
                          <OrderItem key={p.slug} product={p} />
                        ))}
                      </ul>
                    ) : (
                      <p className="bg-sand-200/60 text-ink-600 rounded-(--radius-control) p-4 text-sm">
                        Cardápio em preparação. Peça um orçamento para saber o
                        que já dá para encomendar.
                      </p>
                    )}
                  </article>
                );
              })}
            </section>
          )}

          {others.length > 0 && (
            <section
              aria-labelledby="mais-encomendas"
              className="mx-auto mt-16 max-w-6xl px-4 sm:px-6"
            >
              <h2 id="mais-encomendas" className="mb-6 text-3xl">
                Para cada ocasião
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((c) => {
                  const items = byCategory(c);
                  return (
                    <li
                      key={c.slug}
                      className="bg-sand-200/60 flex flex-col gap-3 rounded-(--radius-media) p-6"
                    >
                      <h3 className="font-serif text-xl">{c.name}</h3>
                      {c.description && (
                        <p className="text-ink-600 text-sm">{c.description}</p>
                      )}
                      {items.length > 0 ? (
                        <ul className="flex flex-col gap-3">
                          {items.map((p) => (
                            <OrderItem key={p.slug} product={p} />
                          ))}
                        </ul>
                      ) : (
                        <p className="text-ink-600 text-sm">Sob consulta.</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section
            aria-labelledby="como-encomendar"
            className="mx-auto mt-16 max-w-6xl px-4 sm:px-6"
          >
            <h2 id="como-encomendar" className="mb-6 text-3xl">
              Como encomendar
            </h2>
            <ol className="border-sand-200 grid gap-6 border-y py-8 sm:grid-cols-3">
              {[
                [
                  "Conte o que precisa",
                  "Ocasião, número de pessoas, data e restrições alimentares.",
                ],
                [
                  "Receba o orçamento",
                  "Montamos o cardápio e o valor com você, pelo WhatsApp.",
                ],
                [
                  "Confirme a encomenda",
                  "Combinamos o prazo, a retirada ou a entrega.",
                ],
              ].map(([t, d], i) => (
                <li key={t} className="flex flex-col gap-2">
                  <span className="text-leaf-700 font-serif text-3xl">
                    {i + 1}
                  </span>
                  <p className="text-forest-900 font-medium">{t}</p>
                  <p className="text-ink-600 text-sm">{d}</p>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </main>
  );
}
