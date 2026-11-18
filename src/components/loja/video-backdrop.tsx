"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Vídeo de fundo das aberturas (D-041, D-050): em laço e sem som, atrás do
 * texto. A capa aparece na hora; o vídeo entra quando carrega. Com "reduzir
 * movimento" ou economia de dados, fica só a capa. Fora da tela, pausa. O
 * botão de pausar existe porque nem todo mundo quer vídeo rodando.
 *
 * Fica dentro de uma seção `relative isolate`; cada aparelho baixa uma versão:
 * `{base}-mobile.mp4` (em pé), `{base}-720.mp4` e `{base}-1080.mp4`.
 */
export function VideoBackdrop({
  base,
  poster,
  alt,
  buttonClassName = "absolute top-4 right-4 md:top-auto md:right-8 md:bottom-8",
}: {
  base: string;
  poster: string;
  alt: string;
  buttonClassName?: string;
}) {
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
      // O navegador barrou o início automático: fica a capa e o botão.
    });
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
    <>
      <Image
        src={poster}
        alt={alt}
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
        poster={poster}
        aria-hidden="true"
        tabIndex={-1}
        className={`absolute inset-0 -z-10 h-full w-full object-cover transition-opacity duration-700 ${playing ? "opacity-100" : "opacity-0"}`}
      >
        <source
          src={`${base}-mobile.mp4`}
          type="video/mp4"
          media="(max-width: 767px)"
        />
        <source
          src={`${base}-720.mp4`}
          type="video/mp4"
          media="(max-width: 1279px)"
        />
        <source src={`${base}-1080.mp4`} type="video/mp4" />
      </video>
      {allowed && (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pausar o vídeo" : "Tocar o vídeo"}
          className={`z-10 grid size-11 place-items-center rounded-full border border-[#faf6ee]/40 bg-[#08130d]/50 text-[#faf6ee] backdrop-blur-sm ${buttonClassName}`}
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
    </>
  );
}
