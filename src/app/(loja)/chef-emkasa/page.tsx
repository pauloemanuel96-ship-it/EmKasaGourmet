import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChefRequestForm } from "@/components/loja/chef/chef-request-form";
import { ChefStage } from "@/components/loja/chef/chef-stage";
import { VideoBackdrop } from "@/components/loja/video-backdrop";
import { SITE_PHOTOS } from "@/modules/catalogo/static-photos";
import { CHEF_CITY, CHEF_FORMATS } from "@/modules/chef/schemas";

export const metadata: Metadata = {
  title: "Chef Emkasa: a Chef na sua casa",
  description:
    "A Chef Angela e a cozinha natural da Emkasa na sua casa, em Aracaju: jantar para uma ocasião especial ou a comida da semana pronta e porcionada.",
  alternates: { canonical: "/chef-emkasa" },
};

const GOLD = "#fed216";

const DIFFERENCES = [
  {
    title: "Ela chega sabendo quem come o quê",
    text: "Quem cadastra a família na Minha Casa já manda junto alergias, dietas, gostos e o que cada um não come.",
  },
  {
    title: "Segurança por regra, não por memória",
    text: "Alergia é conferida pela ficha de cada prato. O que “pode conter” conta como “contém”.",
  },
  {
    title: "Comida que dura e se identifica",
    text: "Na Semana, tudo vai nas embalagens transparentes da Emkasa, com etiqueta de prato, pessoa e data.",
  },
  {
    title: "Cozinha limpa no fim",
    text: "A Chef organiza e limpa o que usou. Você só aproveita.",
  },
];

const STEPS = [
  {
    title: "Você pede a proposta",
    text: "Conta a ocasião ou a rotina da casa, o bairro e quantas pessoas.",
  },
  {
    title: "A equipe monta o menu",
    text: "Pelo WhatsApp, com o cardápio, o valor e a data combinados com você.",
  },
  {
    title: "A Chef vai até você",
    text: "Cozinha na sua casa, serve ou porciona, e deixa tudo em ordem.",
  },
  {
    title: "Vira rotina, se quiser",
    text: "Gostou da Semana? A assinatura garante o mesmo dia todo mês.",
  },
];

const FAQ = [
  {
    q: "Onde vocês atendem?",
    a: `Por enquanto, só em ${CHEF_CITY}. O Rio de Janeiro vem depois.`,
  },
  {
    q: "Quanto custa?",
    a: "Cada proposta é feita sob medida: depende do formato, do menu e de quantas pessoas. O valor vem na proposta, antes de qualquer compromisso.",
  },
  {
    q: "Quem compra os ingredientes?",
    a: "Isso é combinado na proposta, com tudo por escrito.",
  },
  {
    q: "Sigo dieta de nutricionista. Dá certo?",
    a: "Sim. A Chef segue o plano que você já tem; ela não prescreve dieta. Conte isso no pedido.",
  },
];

export default function ChefEmkasaPage() {
  return (
    <main
      className="overflow-x-clip pb-12 text-[#faf3e6]"
      style={{
        background:
          "radial-gradient(80% 50% at 85% 0%, rgba(254,210,22,0.10), transparent 60%), linear-gradient(180deg, #120d09 0%, #0b0907 55%, #120d09 100%)",
      }}
    >
      {/* Abertura em vídeo (D-050) */}
      <section
        aria-label="Apresentação"
        className="relative isolate flex min-h-[calc(100svh-11rem)] items-end overflow-hidden md:min-h-[calc(100svh-6.5rem)] md:items-center"
      >
        <VideoBackdrop
          base="/video/chef"
          poster="/video/chef-poster.webp"
          alt="Mãos de chef montando uma salada num prato de cerâmica"
        />
        {/* escurece só onde o texto fica; o prato continua aparecendo */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0b0907] via-[#0b0907]/70 to-[#0b0907]/5 md:bg-gradient-to-r md:from-[#0b0907]/95 md:via-[#0b0907]/55 md:to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-b from-transparent to-[#120d09]"
        />
        <div className="mx-auto w-full max-w-6xl px-4 pt-48 pb-10 sm:px-6 md:py-16">
          <div className="flex max-w-xl flex-col gap-5">
            <p
              className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] uppercase"
              style={{ color: GOLD }}
            >
              <span aria-hidden="true" className="fit-dot" />
              Chef Emkasa · {CHEF_CITY}
            </p>
            <h1 className="font-serif text-4xl leading-tight text-[#faf3e6] sm:text-6xl">
              A cozinha da Chef Angela, na sua casa.
            </h1>
            <p className="max-w-md text-lg text-[#faf3e6]/85">
              Um jantar para comemorar ou a comida da semana pronta e
              porcionada. Feito na sua cozinha, pensado para quem mora aí.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#pedido"
                className="inline-flex min-h-12 items-center rounded-full px-6 font-semibold text-[#1a120c] shadow-[0_0_24px_rgba(254,210,22,0.35)] active:scale-[0.97]"
                style={{ background: GOLD }}
              >
                Pedir minha proposta
              </a>
              <a
                href="#como-funciona"
                className="inline-flex min-h-12 items-center rounded-full border border-[#faf3e6]/40 bg-[#0b0907]/30 px-6 font-medium backdrop-blur-sm hover:bg-[#faf3e6]/10"
              >
                Como funciona
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Mesa posta em 3D */}
      <section
        aria-labelledby="mesa-posta"
        className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-14 pb-10 sm:px-6 md:grid-cols-[0.9fr_1.1fr]"
      >
        <div className="flex flex-col gap-4">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: GOLD }}
          >
            A mesa posta
          </p>
          <h2
            id="mesa-posta"
            className="font-serif text-3xl text-[#faf3e6] sm:text-4xl"
          >
            Levante a tampa.
          </h2>
          <p className="text-[#faf3e6]/75">
            Comida de verdade, montada na hora, servida no seu prato. Toque no
            prato para abrir e fechar; arraste para girar a mesa.
          </p>
        </div>
        <ChefStage />
      </section>

      {/* Quem vai até você */}
      <section
        aria-labelledby="quem-cozinha"
        className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[0.9fr_1.1fr]"
      >
        <div className="relative mx-auto w-full max-w-sm">
          <div
            aria-hidden="true"
            className="chef-halo absolute -inset-6 rounded-[2.5rem]"
          />
          <div className="chef-ring relative aspect-[4/5] overflow-hidden rounded-[2rem]">
            <Image
              src={SITE_PHOTOS.chefAngela.url}
              alt={SITE_PHOTOS.chefAngela.alt}
              fill
              sizes="(min-width: 768px) 24rem, 90vw"
              className="object-cover"
            />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: GOLD }}
          >
            Quem vai até você
          </p>
          <h2
            id="quem-cozinha"
            className="font-serif text-3xl text-[#faf3e6] sm:text-4xl"
          >
            Chef Angela Acioli
          </h2>
          <p className="text-[#faf3e6]/75">
            Vegana, mãe e professora de culinária saudável há mais de 20 anos.
            Para ela, a comida junta conhecimento, afeto e cuidado com as
            pessoas. No Chef Emkasa, é esse cuidado que entra na sua cozinha.
          </p>
          <p className="text-sm text-[#faf3e6]/60">
            Quer que ela chegue sabendo de todo mundo?{" "}
            <Link href="/minha-casa" className="underline underline-offset-4">
              Cadastre sua família na Minha Casa
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Formatos */}
      <section
        aria-labelledby="formatos"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6"
      >
        <h2
          id="formatos"
          className="mb-8 font-serif text-3xl text-[#faf3e6] sm:text-4xl"
        >
          Escolha como a Chef entra na sua casa
        </h2>
        <ul className="grid gap-5 md:grid-cols-3">
          {CHEF_FORMATS.map((f, i) => (
            <li
              key={f.code}
              className="chef-card relative flex flex-col gap-3 overflow-hidden rounded-(--radius-media) p-6"
            >
              {i === 1 && <span aria-hidden="true" className="fit-scan" />}
              <p
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: GOLD }}
              >
                {f.tag}
              </p>
              <p className="font-serif text-2xl">{f.name}</p>
              <p className="text-sm text-[#faf3e6]/75">{f.text}</p>
              <p className="mt-auto pt-2 text-sm font-medium text-[#faf3e6]/90">
                Valor sob proposta
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Diferenciais */}
      <section
        aria-labelledby="diferenciais"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6"
      >
        <h2
          id="diferenciais"
          className="mb-8 font-serif text-3xl text-[#faf3e6] sm:text-4xl"
        >
          O que só a Emkasa leva junto
        </h2>
        <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {DIFFERENCES.map((d, i) => (
            <li key={d.title} className="flex gap-4">
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold"
                style={{
                  color: GOLD,
                  boxShadow: `0 0 0 1.5px ${GOLD}, 0 0 16px ${GOLD}55`,
                }}
              >
                {i + 1}
              </span>
              <div>
                <p className="font-medium">{d.title}</p>
                <p className="text-sm text-[#faf3e6]/70">{d.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Como funciona */}
      <section
        id="como-funciona"
        aria-labelledby="como-funciona-titulo"
        className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6"
      >
        <h2
          id="como-funciona-titulo"
          className="mb-10 font-serif text-3xl text-[#faf3e6] sm:text-4xl"
        >
          Como funciona
        </h2>
        <ol className="chef-steps relative grid gap-8 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="relative flex flex-col gap-2 pl-10 md:pt-10 md:pl-0"
            >
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 grid size-7 place-items-center rounded-full text-xs font-bold text-[#1a120c]"
                style={{ background: GOLD, boxShadow: `0 0 14px ${GOLD}` }}
              >
                {i + 1}
              </span>
              <p className="font-medium">{s.title}</p>
              <p className="text-sm text-[#faf3e6]/70">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Pedido */}
      <section
        id="pedido"
        aria-labelledby="pedido-titulo"
        className="mx-auto grid max-w-6xl scroll-mt-24 gap-10 px-4 py-16 sm:px-6 md:grid-cols-[0.8fr_1.2fr]"
      >
        <div className="flex flex-col gap-4">
          <h2
            id="pedido-titulo"
            className="font-serif text-3xl text-[#faf3e6] sm:text-4xl"
          >
            Peça sua proposta
          </h2>
          <p className="text-[#faf3e6]/75">
            Leva um minuto. A equipe da Chef responde pelo WhatsApp com o menu,
            o valor e a data.
          </p>
          <dl className="mt-4 flex flex-col gap-5">
            {FAQ.map((f) => (
              <div key={f.q}>
                <dt className="font-medium" style={{ color: GOLD }}>
                  {f.q}
                </dt>
                <dd className="mt-1 text-sm text-[#faf3e6]/70">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
        <ChefRequestForm />
      </section>
    </main>
  );
}
