import Link from "next/link";
import { Photo } from "@/components/loja/photo";
import { ProductArt } from "@/components/loja/product-art";
import { ProductTile } from "@/components/loja/product-tile";
import { Section } from "@/components/loja/section";
import { BOX_PLANS, COURSES, RECIPES, TESTIMONIALS } from "@/demo/data";
import { formatCents } from "@/lib/money";
import { SITE_PHOTOS, STATIC_COVERS } from "@/modules/catalogo/static-photos";
import { getStoreCatalog } from "@/modules/catalogo/store";

/** Textos de cada seção da loja na vitrine (por slug da categoria real). */
const SHOWCASE: Record<
  string,
  { eyebrow: string; title: string; lead?: string }
> = {
  "horta-e-naturais": {
    eyebrow: "Horta e Naturais",
    title: "Da horta desta semana",
    lead: "O que tem hoje muda conforme a colheita. Quando acaba, avisamos aqui na hora.",
  },
  "refeicoes-congeladas": {
    eyebrow: "Refeições Congeladas",
    title: "Comida de verdade no freezer",
    lead: "Pratos, kits e combos com ficha técnica e alergênicos à vista.",
  },
  "produtos-da-emkasa": {
    eyebrow: "Produtos da Emkasa",
    title: "Feitos aqui, para a sua despensa",
  },
};

export default async function Home() {
  const catalog = await getStoreCatalog();
  const showcases = catalog.sections
    .filter((s) => s.channel === "loja")
    .map((s) => ({
      section: s,
      copy: SHOWCASE[s.slug] ?? { eyebrow: s.name, title: s.name },
      products: catalog.products
        .filter((p) => p.sectionSlug === s.slug)
        .sort((a, b) => Number(b.inSeason) - Number(a.inSeason))
        .slice(0, 4),
    }))
    .filter((v) => v.products.length > 0);
  const orders = catalog.sections.find((s) => s.channel === "encomendas");

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 sm:px-6 md:grid-cols-2 md:pt-20">
        <div className="flex flex-col gap-6">
          <p className="text-leaf-700 text-xs font-medium tracking-widest uppercase">
            Horta · Cozinha · Casa
          </p>
          <h1 className="text-4xl sm:text-6xl">
            Alimentar é uma forma de cuidar.
          </h1>
          <p className="text-ink-600 max-w-prose text-lg">
            Da nossa horta e da cozinha da Chef Angela para a sua mesa:
            refeições prontas, cestas da semana e receitas para a família
            inteira comer melhor sem complicar a rotina.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/box"
              className="bg-forest-900 text-cream-50 hover:bg-forest-700 min-h-11 rounded-(--radius-control) px-6 py-3 font-medium"
            >
              Montar meu BOX
            </Link>
            <Link
              href="/loja"
              className="border-forest-900 text-forest-900 hover:bg-sand-200 min-h-11 rounded-(--radius-control) border px-6 py-3 font-medium"
            >
              Ver a loja
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Photo
            src={SITE_PHOTOS.saladaNoPote1.url}
            alt={SITE_PHOTOS.saladaNoPote1.alt}
            priority
          />
          <Photo
            src={STATIC_COVERS["farofa-nutritiva-de-soja"].url}
            alt={STATIC_COVERS["farofa-nutritiva-de-soja"].alt}
            ratio="4/5"
            priority
            className="mt-10"
          />
        </div>
      </section>

      {/* Proposta de valor */}
      <section
        aria-label="Como funciona"
        className="mx-auto mt-20 max-w-6xl px-4 sm:px-6"
      >
        <ol className="border-sand-200 grid gap-6 border-y py-10 sm:grid-cols-3">
          {[
            [
              "Conte sobre a sua casa",
              "Quantas pessoas, o que cada uma come e o que precisa evitar.",
            ],
            [
              "Receba o que faz sentido",
              "Cruzamos o seu perfil com o que a horta e a cozinha têm de verdade.",
            ],
            [
              "Aprenda junto",
              "Cada cesta vem com receitas da Chef Angela para usar tudo.",
            ],
          ].map(([t, d], i) => (
            <li key={t} className="flex flex-col gap-2">
              <span className="text-leaf-700 font-serif text-3xl">{i + 1}</span>
              <p className="text-forest-900 font-medium">{t}</p>
              <p className="text-ink-600 text-sm">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {showcases.map(({ section, copy, products }) => (
        <Section
          key={section.slug}
          id={section.slug}
          eyebrow={copy.eyebrow}
          title={copy.title}
          lead={copy.lead}
          action={{
            href: `/loja?secao=${section.slug}`,
            label: `Ver ${section.name.toLowerCase()}`,
          }}
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {products.map((p) => (
              <ProductTile key={p.slug} product={p} />
            ))}
          </div>
        </Section>
      ))}

      {orders && (
        <section
          aria-labelledby="encomendas"
          className="mx-auto mt-24 max-w-6xl px-4 sm:px-6"
        >
          <div className="bg-forest-900 text-cream-50 relative overflow-hidden rounded-(--radius-media) p-8 sm:p-12">
            <div
              aria-hidden="true"
              className="bg-leaf-500/30 absolute -top-16 -right-16 size-64 rounded-full blur-3xl"
            />
            <p className="text-cream-50/80 text-xs font-medium tracking-widest uppercase">
              {orders.name}
            </p>
            <h2
              id="encomendas"
              className="text-cream-50 mt-2 max-w-xl text-3xl sm:text-4xl"
            >
              Ceias, confraternizações e datas especiais
            </h2>
            <ul className="mt-6 flex flex-wrap gap-2">
              {orders.children.slice(0, 5).map((c) => (
                <li
                  key={c.slug}
                  className={`rounded-full px-3 py-1 text-sm ${
                    c.featured
                      ? "bg-cream-50 text-forest-900 font-medium"
                      : "border-cream-50/40 border"
                  }`}
                >
                  {c.name}
                </li>
              ))}
            </ul>
            <Link
              href="/encomendas"
              className="bg-cream-50 text-forest-900 hover:bg-sand-200 mt-8 inline-flex min-h-11 items-center rounded-(--radius-control) px-6 font-medium"
            >
              Ver encomendas
            </Link>
          </div>
        </section>
      )}

      {/* BOX */}
      <Section
        id="box"
        eyebrow="Emkasa BOX"
        title="Uma cesta pensada para a sua casa"
        lead="Escolha pelo tamanho da família. A composição respeita alergias, preferências e o estoque real da semana."
        action={{ href: "/box", label: "Montar meu BOX" }}
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BOX_PLANS.map((b) => (
            <li
              key={b.code}
              className="bg-sand-200/60 flex flex-col gap-2 rounded-(--radius-media) p-6"
            >
              <p className="text-forest-900 font-serif text-2xl">{b.name}</p>
              <p className="text-ink-600 text-sm">{b.people}</p>
              <p className="text-terracotta-500 mt-2 font-medium">
                {formatCents(b.priceCents)}{" "}
                <span className="text-ink-600 text-xs">/ entrega</span>
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Chef */}
      <section
        aria-labelledby="chef"
        className="mx-auto mt-24 grid max-w-6xl items-center gap-10 px-4 sm:px-6 md:grid-cols-2"
      >
        <Photo
          src={SITE_PHOTOS.chefAngela.url}
          alt={SITE_PHOTOS.chefAngela.alt}
          sizes="(min-width: 768px) 50vw, 100vw"
        />
        <div className="flex flex-col gap-4">
          <p className="text-leaf-700 text-xs font-medium tracking-widest uppercase">
            Quem cozinha
          </p>
          <h2 id="chef" className="text-3xl sm:text-4xl">
            Chef Angela Acioli
          </h2>
          <p className="text-ink-600">
            Vegana, mãe e professora de culinária saudável há mais de 20 anos.
            Para ela, a comida junta conhecimento, afeto e cuidado com as
            pessoas.
          </p>
          <p className="text-ink-600 text-sm">
            [Texto provisório: a versão final será escrita e aprovada pela
            Chef.]
          </p>
        </div>
      </section>

      <Section
        id="receitas"
        eyebrow="Receitas"
        title="Para usar tudo o que chegou"
        action={{ href: "/receitas", label: "Todas as receitas" }}
      >
        <ul className="grid gap-6 md:grid-cols-3">
          {RECIPES.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/receitas/${r.slug}`}
                className="group flex flex-col gap-3"
              >
                <ProductArt name={r.title} tone={r.tone} ratio="3/2" />
                <p className="text-ink-900 font-medium group-hover:underline">
                  {r.title}
                </p>
                <p className="text-ink-600 text-sm">
                  {r.minutes} min · {r.servings} porções
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="escola"
        eyebrow="Emkasa Escola"
        title="Aprenda com a Chef"
        action={{ href: "/escola", label: "Ver cursos" }}
      >
        <ul className="grid gap-4 md:grid-cols-3">
          {COURSES.map((c) => (
            <li
              key={c.slug}
              className="border-sand-200 flex flex-col gap-2 border-t pt-4"
            >
              <p className="text-forest-900 font-medium">{c.title}</p>
              <p className="text-ink-600 text-sm">{c.format}</p>
              <p className="text-terracotta-500 text-sm font-medium">
                {c.priceCents === null ? "Gratuito" : formatCents(c.priceCents)}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="depoimentos"
        eyebrow="Quem já recebe"
        title="Histórias de quem come com a gente"
      >
        <ul className="grid gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <li key={t.name}>
              <figure className="bg-paper flex h-full flex-col gap-3 rounded-(--radius-media) p-6">
                <blockquote className="text-forest-900 font-serif text-lg">
                  “{t.text}”
                </blockquote>
                <figcaption className="text-ink-600 text-sm">
                  {t.name} · exemplo
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Section>

      {/* CTA assinatura */}
      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <div className="bg-forest-900 text-cream-50 flex flex-col items-start gap-4 rounded-(--radius-media) p-8 sm:p-12">
          <h2 className="text-cream-50 text-3xl sm:text-4xl">
            Toda semana, sem pensar no mercado.
          </h2>
          <p className="text-cream-50/80 max-w-prose">
            Assine o BOX semanal ou quinzenal. Pause quando viajar, troque itens
            e acompanhe a próxima entrega pela Minha Casa.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/box"
              className="bg-cream-50 text-forest-900 min-h-11 rounded-(--radius-control) px-6 py-3 font-medium"
            >
              Quero assinar
            </Link>
            <span className="border-cream-50/40 text-cream-50/80 min-h-11 rounded-(--radius-control) border px-6 py-3 text-sm">
              WhatsApp de atendimento [pendente]
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
