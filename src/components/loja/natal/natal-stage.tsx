"use client";

import { useEffect, useRef, useState } from "react";
import type { LightMode, NatalHandle } from "./natal-scene";

/** O que cada presente revela ao abrir (na ordem: vermelho, branco, verde). */
export type GiftReveal = {
  title: string;
  text: string;
  href: string;
  cta: string;
  external?: boolean;
};

const LIGHT_LABEL: Record<LightMode, string> = {
  quentes: "Luzes quentes",
  coloridas: "Luzes coloridas",
  apagadas: "Luzes apagadas",
};

/** Dias que faltam para 25 de dezembro, no relógio de quem está vendo. */
function daysToChristmas(now: Date) {
  const year =
    now.getMonth() === 11 && now.getDate() > 25
      ? now.getFullYear() + 1
      : now.getFullYear();
  const target = new Date(year, 11, 25);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Abertura da página de Natal: árvore 3D atrás do texto (D-035).
 * Sem WebGL, fica só o fundo natalino em CSS, e o texto continua igual.
 */
export function NatalStage({
  children,
  gifts,
}: {
  children: React.ReactNode;
  gifts: GiftReveal[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<NatalHandle | null>(null);
  const [live, setLive] = useState(false);
  const [mode, setMode] = useState<LightMode>("quentes");
  const [days, setDays] = useState<number | null>(null);
  const [opened, setOpened] = useState<number | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() =>
      setDays(daysToChristmas(new Date())),
    );
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    try {
      const nav = navigator as Navigator & {
        connection?: { saveData?: boolean };
      };
      if (nav.connection?.saveData) return;
      if (!document.createElement("canvas").getContext("webgl2")) return;
    } catch {
      return;
    }
    let cancelled = false;
    let handle: NatalHandle | null = null;
    const onResize = () => handle?.resize();
    const visibility = new IntersectionObserver(([entry]) => {
      handle?.setActive(entry.isIntersecting);
    });
    import("./natal-scene")
      .then(({ createNatalScene }) => {
        if (cancelled) return;
        handle = createNatalScene(canvas, {
          reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches,
          onGift: (index, open) => setOpened(open ? index : null),
        });
        handleRef.current = handle;
        setLive(true);
        window.addEventListener("resize", onResize);
        visibility.observe(wrap);
      })
      .catch(() => {
        // Sem 3D: a página segue com o fundo em CSS.
      });
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      visibility.disconnect();
      handle?.dispose();
      handleRef.current = null;
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative isolate flex min-h-[150svh] flex-col overflow-hidden md:min-h-[calc(100svh-4.5rem)]"
      style={{
        background:
          "radial-gradient(120% 70% at 50% 78%, #1d4a33 0%, #10281c 45%, #08130d 100%)",
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`absolute inset-0 z-0 h-full w-full cursor-grab touch-pan-y transition-opacity duration-700 active:cursor-grabbing ${live ? "opacity-100" : "opacity-0"}`}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-28 bg-gradient-to-b from-transparent to-[#08130d]"
      />
      <div className="pointer-events-none relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-10 pb-6 sm:px-6 md:justify-center md:py-12">
        <div className="pointer-events-auto flex max-w-xl flex-col gap-4 md:max-w-md">
          {children}
          {days !== null && days >= 0 && (
            <p className="text-sm font-medium text-[#f3dfa2]">
              {days === 0
                ? "Hoje é Natal."
                : days === 1
                  ? "Falta 1 dia para o Natal."
                  : `Faltam ${days} dias para o Natal.`}
            </p>
          )}
        </div>
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-4 bottom-20 z-40 flex justify-center md:inset-x-auto md:bottom-24 md:left-8"
        >
          {opened !== null && gifts[opened] && (
            <div className="natal-reveal pointer-events-auto flex w-full max-w-sm flex-col gap-2 rounded-(--radius-media) border border-[#f3dfa2]/40 bg-[#08130d]/85 p-5 shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold tracking-widest text-[#f3dfa2] uppercase">
                Você abriu
              </p>
              <p className="font-serif text-2xl text-[#faf6ee]">
                {gifts[opened].title}
              </p>
              <p className="text-sm text-[#faf6ee]/80">{gifts[opened].text}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <a
                  href={gifts[opened].href}
                  {...(gifts[opened].external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  onClick={() => {
                    handleRef.current?.closeGifts();
                    setOpened(null);
                  }}
                  className="inline-flex min-h-10 items-center rounded-full bg-[#f3dfa2] px-5 text-sm font-semibold text-[#3d1216] active:scale-[0.97]"
                >
                  {gifts[opened].cta}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    handleRef.current?.closeGifts();
                    setOpened(null);
                  }}
                  className="min-h-10 px-2 text-sm text-[#faf6ee]/70 underline underline-offset-4"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
        {live && (
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-6 pb-20 md:pb-4">
            <button
              type="button"
              onClick={() => {
                const next = handleRef.current?.cycleLights();
                if (next) setMode(next);
              }}
              className="pointer-events-auto inline-flex min-h-10 items-center gap-2 rounded-full border border-[#f3dfa2]/50 bg-[#08130d]/60 px-4 text-sm font-medium text-[#f3dfa2] backdrop-blur active:scale-[0.97]"
            >
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full"
                style={{
                  background:
                    mode === "apagadas"
                      ? "#5a5650"
                      : mode === "coloridas"
                        ? "conic-gradient(#ff4d4d,#ffd23f,#6bff8a,#4dd6ff,#ff8ad8,#ff4d4d)"
                        : "#ffd27a",
                }}
              />
              {LIGHT_LABEL[mode]}
            </button>
            <p className="rounded-full bg-[#08130d]/60 px-3 py-1.5 text-xs text-[#faf6ee]/85 backdrop-blur">
              Arraste para girar. Abra os presentes para descobrir as ceias.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
