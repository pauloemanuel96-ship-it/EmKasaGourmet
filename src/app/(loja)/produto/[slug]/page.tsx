import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/loja/add-to-cart";
import { AllergenBlock } from "@/components/loja/allergen-block";
import { DemoPrice } from "@/components/loja/demo-price";
import { HouseholdFitCard } from "@/components/loja/household-fit";
import { DemoTag } from "@/components/loja/demo-tag";
import { Photo } from "@/components/loja/photo";
import { ProductImage } from "@/components/loja/product-image";
import { RECIPES } from "@/demo/data";
import { formatCents } from "@/lib/money";
import { getStoreCatalog, getStoreProduct } from "@/modules/catalogo/store";
import { whatsappLink } from "@/modules/catalogo/store-types";
import { STORAGE_LABEL } from "@/modules/catalogo/types";
import { jsonLd, productLd } from "@/modules/seo/json-ld";
import { ShareButton } from "@/components/loja/share-button";

export async function generateStaticParams() {
  const catalog = await getStoreCatalog();
  return catalog.products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/produto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getStoreProduct(slug);
  if (!product) return { title: "Produto" };
  const description = product.short ?? product.description ?? undefined;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/produto/${product.slug}` },
    // Item de demonstração não é produto à venda: fica fora da busca.
    robots: product.isDemo ? { index: false } : undefined,
    openGraph: {
      title: product.name,
      description,
      images: product.cover ? [{ url: product.cover.url }] : undefined,
    },
  };
}

export default async function ProdutoPage({
  params,
}: PageProps<"/produto/[slug]">) {
  const { slug } = await params;
  const { product: p, catalog } = await getStoreProduct(slug);
  if (!p) notFound();
  const recipes = p.isDemo
    ? RECIPES.filter((r) => r.products.includes(p.slug))
    : [];
  const quote = p.quoteOnly || p.channel === "encomendas";
  const wa = whatsappLink(
    catalog.whatsapp,
    p.comingSoon
      ? `Olá! Quero saber quando "${p.name}" estará disponível na loja da Emkasa.`
      : `Olá! Quero um orçamento de "${p.name}" pela loja da Emkasa.`,
  );

  const ld = productLd(p);

  return (
    <main className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      {ld && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(ld) }}
        />
      )}
      <nav aria-label="Trilha" className="text-ink-600 mb-6 text-sm">
        <Link
          href={quote ? "/encomendas" : "/loja"}
          className="hover:underline"
        >
          {quote ? "Encomendas" : "Loja"}
        </Link>{" "}
        /{" "}
        <Link
          href={quote ? "/encomendas" : `/loja?secao=${p.sectionSlug}`}
          className="hover:underline"
        >
          {p.sectionName}
        </Link>{" "}
        / {p.name}
      </nav>
      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative">
          <ProductImage
            product={p}
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          {p.isDemo && (
            <DemoTag soon={p.comingSoon} className="absolute top-3 left-3" />
          )}
          {p.gallery.length > 0 && (
            <ul className="mt-4 grid grid-cols-3 gap-3" aria-label="Mais fotos">
              {p.gallery.map((g) => (
                <li key={g.url}>
                  <Photo
                    src={g.url}
                    alt={g.alt}
                    ratio="3/4"
                    sizes="(min-width: 768px) 16vw, 33vw"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-leaf-700 text-xs font-medium tracking-widest uppercase">
              {p.path.join(" · ")}
            </p>
            <h1 className="text-4xl">{p.name}</h1>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-ink-600">{p.unitLabel}</p>
              <ShareButton
                title={`${p.name} | Emkasa Gourmet`}
                text={`Olha isso da Emkasa: ${p.name}`}
                path={`/produto/${p.slug}`}
              />
            </div>
            {p.comingSoon ? (
              <p className="text-terracotta-500 text-2xl font-medium">
                Preço a definir
              </p>
            ) : p.isDemo ? (
              <DemoPrice slug={p.slug} />
            ) : (
              <p className="text-terracotta-500 text-2xl font-medium">
                {p.priceCents !== null
                  ? `${p.quoteOnly ? "A partir de " : ""}${formatCents(p.priceCents)}`
                  : "Sob orçamento"}
              </p>
            )}
          </div>
          {p.isDemo && (
            <p className="bg-sand-200 rounded-(--radius-control) p-3 text-sm">
              {p.comingSoon
                ? "Em breve na loja. Preço, embalagem, ingredientes e alergênicos estão sendo cadastrados."
                : "Produto de demonstração: preço e disponibilidade são fictícios e ele não está à venda."}
            </p>
          )}
          {(p.description ?? p.short) && (
            <p className="text-ink-900">{p.description ?? p.short}</p>
          )}
          {p.diet.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Alimentação">
              {p.diet.map((d) => (
                <li
                  key={d.code}
                  className="border-leaf-500/50 text-forest-700 rounded border px-2 py-1 text-xs"
                >
                  {d.name}
                </li>
              ))}
            </ul>
          )}
          {quote ? (
            wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-forest-900 text-cream-50 hover:bg-forest-700 flex min-h-11 items-center justify-center rounded-(--radius-control) px-5 font-medium"
              >
                Pedir orçamento pelo WhatsApp
              </a>
            ) : (
              <p className="bg-sand-200 text-ink-600 rounded-(--radius-control) p-4 text-sm">
                Pedidos de orçamento abrem em breve.
              </p>
            )
          ) : p.comingSoon ? (
            wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="border-forest-900 text-forest-900 hover:bg-sand-200 flex min-h-11 items-center justify-center rounded-(--radius-control) border px-5 font-medium"
              >
                Quero ser avisado pelo WhatsApp
              </a>
            ) : null
          ) : (
            <AddToCart product={p} />
          )}
          <AllergenBlock product={p} />
          <Suspense fallback={null}>
            <HouseholdFitCard slug={p.slug} isDemo={p.isDemo} />
          </Suspense>
          <dl className="grid gap-3 text-sm">
            {p.ingredients.length > 0 && (
              <div>
                <dt className="font-medium">Ingredientes</dt>
                <dd className="text-ink-600">{p.ingredients.join(", ")}</dd>
              </div>
            )}
            {(!p.isDemo || p.conservation) && (
              <div>
                <dt className="font-medium">Conservação</dt>
                <dd className="text-ink-600">
                  {STORAGE_LABEL[p.storage]}.
                  {p.conservation ? ` ${p.conservation}` : ""}
                </dd>
              </div>
            )}
            {(p.yieldInfo || p.portions) && (
              <div>
                <dt className="font-medium">Rendimento</dt>
                <dd className="text-ink-600">
                  {p.yieldInfo ?? `${p.portions} porções`}
                </dd>
              </div>
            )}
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
