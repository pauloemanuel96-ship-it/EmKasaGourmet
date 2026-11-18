"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ChefHandle } from "./chef-scene";

/**
 * Mesa posta em 3D do Chef Emkasa (D-049). A tampa sobe sozinha na primeira
 * vez; tocar no prato abre e fecha; arrastar gira a mesa. Sem WebGL, sem
 * dados móveis ou com movimento reduzido no aparelho, fica uma foto real.
 */
export function ChefStage() {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<ChefHandle | null>(null);
  const [live, setLive] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    try {
      const nav = navigator as Navigator & {
        connection?: { saveData?: boolean };
        deviceMemory?: number;
      };
      if (nav.connection?.saveData) return;
      if (nav.deviceMemory !== undefined && nav.deviceMemory < 2) return;
      if (!document.createElement("canvas").getContext("webgl2")) return;
    } catch {
      return;
    }
    let cancelled = false;
    let handle: ChefHandle | null = null;
    const onResize = () => handle?.resize();
    const visibility = new IntersectionObserver(([entry]) => {
      handle?.setActive(entry.isIntersecting);
    });
    import("./chef-scene")
      .then(({ createChefScene }) => {
        if (cancelled) return;
        handle = createChefScene(canvas, {
          reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches,
          onOpen: setOpen,
        });
        handleRef.current = handle;
        setLive(true);
        window.addEventListener("resize", onResize);
        visibility.observe(box);
      })
      .catch(() => {
        // Sem 3D: fica a foto.
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
      ref={boxRef}
      className="relative aspect-[4/3.4] w-full overflow-hidden rounded-[2rem] md:aspect-[5/4.4]"
      style={{
        background:
          "radial-gradient(90% 70% at 55% 60%, #3a2617 0%, #1a120c 55%, #0b0907 100%)",
      }}
    >
      {!live && (
        <Image
          src="/fotos/salada-margarita.webp"
          alt="Prato da cozinha natural da Emkasa"
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover opacity-90"
          priority
        />
      )}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full cursor-pointer touch-pan-y transition-opacity duration-700 ${live ? "opacity-100" : "opacity-0"}`}
      />
      <div
        aria-hidden="true"
        className="chef-ring pointer-events-none absolute inset-0 rounded-[2rem]"
      />
      {live && (
        <button
          type="button"
          onClick={() => handleRef.current?.toggle()}
          className="absolute bottom-4 left-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#fed216]/40 bg-[#0b0907]/70 px-4 text-sm font-medium text-[#faf3e6] backdrop-blur"
        >
          <span aria-hidden="true" className="fit-dot" />
          {open ? "Tampar o prato" : "Levantar a tampa"}
        </button>
      )}
    </div>
  );
}
