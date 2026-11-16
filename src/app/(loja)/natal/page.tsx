import type { Metadata } from "next";
import Link from "next/link";
import { DemoTag } from "@/components/loja/demo-tag";
import {
  NatalStage,
  type GiftReveal,
} from "@/components/loja/natal/natal-stage";
import { ProductImage } from "@/components/loja/product-image";
import { formatCents } from "@/lib/money";
import { getStoreCatalog } from "@/modules/catalogo/store";
import {
  whatsappLink,
  type StoreProduct,
} from "@/modules/catalogo/store-types";

export const metadata: Metadata = {
  title: "Natal Emkasa",
  description:
    "Ceia Natural Emkasa e Ceia Tradicional sob encomenda, preparadas pela cozinha da Chef Angela.",
};

const GOLD = "#f3dfa2";

function priceLine(p: StoreProduct) {
  if (p.priceCents === null) return "Sob orçamento";
  return `${p.quoteOnly ? "A partir de " : ""}${formatCents(p.priceCents)}`;
}

function Dish({ product }: { product: StoreProduct }) {
  return (
    <li>
      <Link href={`/produto/${product.slug}`} className="group flex gap-4">
        <div className="relative w-24 shrink-0 sm:w-28">
          <ProductImage product={product} sizes="112px" />
          {product.isDemo && <DemoTag className="absolute top-2 left-2" />}
        </div>
        <div className="flex flex-col gap-1 py-1">
          <p className="font-medium text-[#faf6ee] group-hover:underline">
            {product.name}
          </p>
          {product.short && (
            <p className="text-sm text-[#faf6ee]/70">{product.short}</p>
          )}
          <p className="text-sm font-medium" style={{ color: GOLD }}>
            {priceLine(product)}
          </p>
        </div>
      </Link>
    </li>
  );
}

/** Estrela de quatro pontas usada como divisor. */
function Spark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill={GOLD}
    >
      <path d="M12 0c.9 6.6 4.5 10.2 12 12-7.5 1.8-11.1 5.4-12 12-.9-6.6-4.5-10.2-12-12C7.5 10.2 11.1 6.6 12 0z" />
    </svg>
  );
}

export default async function NatalPage() {
  const catalog = await getStoreCatalog();
  const section = catalog.sections.find((s) => s.channel === "encomendas");
  const ceias = section?.children.filter((c) => c.featured) ?? [];
  const ceiaSlugs = new Set(ceias.map((c) => c.slug));
  const orders = catalog.products.filter((p) => p.channel === "encomendas");
  const inCeia = (slug: string) =>
    orders.filter((p) => p.categorySlug === slug);
  // Pratos avulsos: marcados com a campanha "Natal" no painel, fora das ceias.
  const extras = orders.filter(
    (p) =>
      !ceiaSlugs.has(p.categorySlug) &&
      p.campaigns.some((c) => c.toLowerCase() === "natal"),
  );
  const extraGroups = [...new Set(extras.map((p) => p.categoryName))].map(
    (name) => ({ name, items: extras.filter((p) => p.categoryName === name) }),
  );
  const wa = whatsappLink(
    catalog.whatsapp,
    "Olá! Quero encomendar a ceia de Natal da Emkasa. Pode me ajudar?",
  );
  const order = (label: string) =>
    wa ? (
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center rounded-full px-6 font-semibold text-[#3d1216] active:scale-[0.97]"
        style={{ background: GOLD }}
      >
        {label}
      </a>
    ) : (
      <span className="inline-flex min-h-11 items-center rounded-full border border-[#f3dfa2]/50 px-5 text-sm text-[#f3dfa2]">
        Encomendas abrem em breve
      </span>
    );

  // Cada presente da árvore revela algo de verdade: as ceias e a encomenda.
  const menu: GiftReveal = {
    title: "Cardápio de Natal",
    text: "Veja o que já dá para encomendar.",
    href: "#cardapio",
    cta: "Ver o cardápio",
  };
  const ceiaGift = (i: number): GiftReveal =>
    ceias[i]
      ? {
          title: ceias[i].name,
          text: ceias[i].description ?? "Veja o cardápio desta ceia.",
          href: `#ceia-${ceias[i].slug}`,
          cta: "Ver esta ceia",
        }
      : menu;
  const gifts: GiftReveal[] = [
    ceiaGift(0),
    ceiaGift(1),
    wa
      ? {
          title: "Sua encomenda",
          text: "Fale com a gente e monte a mesa do seu Natal.",
          href: wa,
          cta: "Pedir orçamento pelo WhatsApp",
          external: true,
        }
      : menu,
  ];

  return (
    <main className="bg-[#08130d] text-[#faf6ee]">
      <NatalStage gifts={gifts}>
        <p
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: GOLD }}
        >
          Natal Emkasa
        </p>
        <h1 className="text-4xl text-[#faf6ee] sm:text-6xl">
          A ceia que cuida de quem{" "}
          <em style={{ color: GOLD }}>senta à mesa.</em>
        </h1>
        <p className="text-base text-[#faf6ee]/85 sm:text-lg">
          Ceia Natural Emkasa e Ceia Tradicional, preparadas pela cozinha da
          Chef Angela, sob encomenda.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {order("Encomendar minha ceia")}
          <a
            href="#cardapio"
            className="inline-flex min-h-11 items-center rounded-full border border-[#faf6ee]/40 px-6 font-medium text-[#faf6ee]"
          >
            Ver o cardápio
          </a>
        </div>
      </NatalStage>

      <section
        id="cardapio"
        aria-labelledby="cardapio-titulo"
        className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-16 sm:px-6"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Spark className="size-6" />
          <h2
            id="cardapio-titulo"
            className="text-3xl text-[#faf6ee] sm:text-5xl"
          >
            Escolha a sua ceia
          </h2>
          <p className="max-w-xl text-[#faf6ee]/75">
            Duas mesas, o mesmo cuidado. Você escolhe, a gente monta o orçamento
            com você.
          </p>
        </div>
        {ceias.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {ceias.map((c, i) => {
              const items = inCeia(c.slug);
              return (
                <article
                  key={c.slug}
                  id={`ceia-${c.slug}`}
                  className="relative flex scroll-mt-24 flex-col gap-4 overflow-hidden rounded-(--radius-media) border border-[#f3dfa2]/25 p-6 sm:p-8"
                  style={{
                    background:
                      i % 2 === 0
                        ? "linear-gradient(160deg, #143524 0%, #0c1f15 100%)"
                        : "linear-gradient(160deg, #4a151b 0%, #1d0c0e 100%)",
                  }}
                >
                  <Spark className="absolute top-5 right-5 size-4 opacity-70" />
                  <h3 className="font-serif text-3xl text-[#faf6ee]">
                    {c.name}
                  </h3>
                  {c.description && (
                    <p className="text-[#faf6ee]/75">{c.description}</p>
                  )}
                  {items.length > 0 ? (
                    <ul className="mt-2 flex flex-col gap-4">
                      {items.map((p) => (
                        <Dish key={p.slug} product={p} />
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-(--radius-control) border border-dashed border-[#f3dfa2]/30 p-4 text-sm text-[#faf6ee]/70">
                      Cardápio chegando. Peça um orçamento para saber o que já
                      dá para encomendar.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-10 text-center text-[#faf6ee]/70">
            O cardápio de Natal está sendo preparado.
          </p>
        )}
      </section>

      {extraGroups.map((group) => (
        <section
          key={group.name}
          aria-label={group.name}
          className="mx-auto max-w-6xl px-4 pt-14 sm:px-6"
        >
          <h2 className="mb-6 flex items-center gap-3 text-2xl text-[#faf6ee] sm:text-3xl">
            <Spark className="size-4" />
            {group.name}
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((p) => (
              <Dish key={p.slug} product={p} />
            ))}
          </ul>
        </section>
      ))}

      <section
        aria-labelledby="como-encomendar"
        className="mx-auto max-w-6xl px-4 pt-16 sm:px-6"
      >
        <h2 id="como-encomendar" className="mb-6 text-3xl text-[#faf6ee]">
          Como encomendar
        </h2>
        <ol className="grid gap-6 border-y border-[#f3dfa2]/20 py-8 sm:grid-cols-3">
          {[
            [
              "Conte o que precisa",
              "Número de pessoas, data e restrições alimentares.",
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
              <span className="font-serif text-3xl" style={{ color: GOLD }}>
                {i + 1}
              </span>
              <p className="font-medium text-[#faf6ee]">{t}</p>
              <p className="text-sm text-[#faf6ee]/70">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div
          className="flex flex-col items-start gap-4 rounded-(--radius-media) p-8 sm:p-12"
          style={{
            background:
              "radial-gradient(90% 140% at 90% 10%, #7a1a22 0%, #3d1216 45%, #1d0c0e 100%)",
          }}
        >
          <h2 className="text-3xl text-[#faf6ee] sm:text-4xl">
            Garanta a sua ceia.
          </h2>
          <p className="max-w-prose text-[#faf6ee]/80">
            Fale com a gente e monte a mesa do seu Natal.
          </p>
          <div className="flex flex-wrap gap-3">
            {order("Pedir orçamento pelo WhatsApp")}
            <Link
              href="/encomendas"
              className="inline-flex min-h-11 items-center rounded-full border border-[#faf6ee]/40 px-6 font-medium text-[#faf6ee]"
            >
              Outras encomendas
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
