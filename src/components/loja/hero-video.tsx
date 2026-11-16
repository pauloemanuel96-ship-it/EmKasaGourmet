"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * Abertura da home (D-041): vídeo real da horta ao prato, em laço e sem som,
 * atrás do texto. A primeira imagem (poster) aparece na hora; o vídeo entra
 * quando carrega. Com "reduzir movimento" ou economia de dados, fica só a
 * imagem. O botão de pausar existe porque nem todo mundo quer vídeo rodando.
 */
export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean };
    };
    const still =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      Boolean(nav.connection?.saveData);
    if (still) return;
    const id = requestAnimationFrame(() => setAllowed(true));
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener("playing", onPlay);
    video.addEventListener("pause", onPause);
    video.preload = "auto";
    video.play().catch(() => {
      // O navegador barrou o início automático: fica a imagem e o botão.
    });
    // Fora da tela, o vídeo para de gastar bateria e dados.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (video.dataset.user !== "paused") video.play().catch(() => {});
      } else video.pause();
    });
    io.observe(video);
    return () => {
      cancelAnimationFrame(id);
      io.disconnect();
      video.removeEventListener("playing", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, []);

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.dataset.user = "";
      video.play().catch(() => {});
    } else {
      video.dataset.user = "paused";
      video.pause();
    }
  }

  return (
    <section
      aria-label="Apresentação"
      className="relative isolate flex min-h-[calc(100svh-11rem)] items-end overflow-hidden bg-[#0e1912] text-[#faf6ee] md:min-h-[calc(100svh-6.5rem)] md:items-center"
    >
      <Image
        src="/video/hero-poster.webp"
        alt="Alface crespa crescendo na horta"
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="none"
        poster="/video/hero-poster.webp"
        aria-hidden="true"
        tabIndex={-1}
        className={`absolute inset-0 -z-10 h-full w-full object-cover transition-opacity duration-700 ${playing ? "opacity-100" : "opacity-0"}`}
      >
        <source
          src="/video/hero-mobile.mp4"
          type="video/mp4"
          media="(max-width: 767px)"
        />
        <source
          src="/video/hero-720.mp4"
          type="video/mp4"
          media="(max-width: 1279px)"
        />
        <source src="/video/hero-1080.mp4" type="video/mp4" />
      </video>
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

      {allowed && (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pausar o vídeo" : "Tocar o vídeo"}
          className="absolute top-4 right-4 grid size-11 place-items-center rounded-full border border-[#faf6ee]/40 bg-[#08130d]/50 text-[#faf6ee] backdrop-blur-sm md:top-auto md:right-8 md:bottom-8"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="currentColor"
            aria-hidden="true"
          >
            {playing ? (
              <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
            ) : (
              <path d="M7 4l13 8-13 8z" />
            )}
          </svg>
        </button>
      )}
    </section>
  );
}
