import Link from "next/link";
import { VideoBackdrop } from "./video-backdrop";

/**
 * Abertura da home (D-041): vídeo real da horta ao prato, em laço e sem som,
 * atrás do texto. O comportamento do vídeo fica em VideoBackdrop.
 */
export function HeroVideo() {
  return (
    <section
      aria-label="Apresentação"
      className="relative isolate flex min-h-[calc(100svh-11rem)] items-end overflow-hidden bg-[#0e1912] text-[#faf6ee] md:min-h-[calc(100svh-6.5rem)] md:items-center"
    >
      <VideoBackdrop
        base="/video/hero"
        poster="/video/hero-poster.webp"
        alt="Alface crespa crescendo na horta"
      />
      {/* escurece só onde o texto fica, para a horta continuar aparecendo */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-[#08130d]/95 via-[#08130d]/55 to-[#08130d]/10 md:bg-gradient-to-r md:from-[#08130d]/90 md:via-[#08130d]/50 md:to-transparent"
      />

      <div className="mx-auto w-full max-w-6xl px-4 pt-40 pb-10 sm:px-6 md:py-16">
        <div className="flex max-w-xl flex-col gap-4">
          <p className="text-xs font-semibold tracking-widest text-[#fed216] uppercase">
            Horta · Cozinha · Casa
          </p>
          <h1 className="text-4xl text-[#faf6ee] sm:text-6xl">
            Alimentar é uma forma de <em className="text-[#cfe3a6]">cuidar.</em>
          </h1>
          <p className="max-w-md text-base text-[#faf6ee]/85 sm:text-lg">
            Da nossa horta e da cozinha da Chef Angela para a sua mesa.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/box"
              className="inline-flex min-h-11 items-center rounded-full bg-[#f9630e] px-6 font-semibold text-[#1c1206] active:scale-[0.97]"
            >
              Montar meu BOX
            </Link>
            <Link
              href="/loja"
              className="inline-flex min-h-11 items-center rounded-full border border-[#faf6ee]/50 bg-[#08130d]/30 px-6 font-medium text-[#faf6ee] backdrop-blur-sm active:scale-[0.97]"
            >
              Ver a loja
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
