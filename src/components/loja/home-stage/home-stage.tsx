"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Photo } from "@/components/loja/photo";
import { STAGE_INGREDIENTS } from "./ingredients";
import type { StageHandle, StageKind } from "./scene";

type StagePhoto = { url: string; alt: string };

const ASSETS = {
  labelA: "/fotos/3d/rotulo-farofa-a.webp",
  labelB: "/fotos/3d/rotulo-farofa-b.webp",
  farofa: "/fotos/3d/farofa-textura.webp",
};

function canRun3D() {
  try {
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean };
      deviceMemory?: number;
    };
    if (nav.connection?.saveData) return false;
    if (nav.deviceMemory !== undefined && nav.deviceMemory < 3) return false;
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

/**
 * Liga uma cena 3D a um canvas (D-038). A cena só é baixada e criada quando a
 * seção chega perto da tela e para quando sai. A salada e a Farofa se montam
 * conforme a pessoa rola a página; a caixa da abertura enche sozinha. Sem WebGL, com economia de dados ou em aparelho fraco, nada é criado e
 * a foto de reserva continua no lugar.
 */
function useStage(kind: StageKind) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<StageHandle | null>(null);
  const [live, setLive] = useState(false);
  const [inJar, setInJar] = useState<boolean[]>(() =>
    STAGE_INGREDIENTS.map(() => false),
  );

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas || !canRun3D()) return;
    let cancelled = false;
    let loading = false;
    let handle: StageHandle | null = null;
    let visible = false;
    let seen = false;

    const sync = () => {
      if (!handle) return;
      handle.setActive(visible);
      if (seen) handle.start();
    };
    // Progresso pelo scroll, sem prender a tela: 0 quando a cena desponta
    // embaixo, 1 quando chega ao meio. Na abertura, é o quanto já se rolou.
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (!handle) return;
      const vh = window.innerHeight;
      const r = box.getBoundingClientRect();
      if (kind === "box") {
        handle.setProgress(window.scrollY / vh);
        return;
      }
      const from = vh * 0.92;
      const to = Math.max(vh * 0.5 - r.height / 2, 80);
      handle.setProgress((from - r.top) / (from - to));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const onResize = () => {
      handle?.resize();
      onScroll();
    };
    const load = () => {
      if (loading) return;
      loading = true;
      import("./scene")
        .then(({ createStage }) => {
          if (cancelled) return;
          handle = createStage(canvas, {
            kind,
            assets: ASSETS,
            reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches,
            onState: (state) => setInJar(state),
          });
          handleRef.current = handle;
          setLive(true);
          window.addEventListener("resize", onResize);
          window.addEventListener("scroll", onScroll, { passive: true });
          sync();
          measure();
        })
        .catch(() => {
          // Falhou ao criar a cena: fica a foto.
        });
    };
    // Perto da tela: baixa e cria. Na tela: anima.
    const near = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) load();
      },
      { rootMargin: "500px 0px" },
    );
    const onScreen = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (entry.intersectionRatio >= 0.35) seen = true;
        sync();
      },
      { threshold: [0, 0.35] },
    );
    near.observe(box);
    onScreen.observe(box);
    return () => {
      cancelled = true;
      near.disconnect();
      onScreen.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      handle?.dispose();
      handleRef.current = null;
    };
  }, [kind]);

  const toggle = useCallback((id: string) => handleRef.current?.toggle(id), []);
  return { boxRef, canvasRef, live, inJar, toggle };
}

/** Área da cena: a foto fica de reserva e some quando o 3D entra. */
function StageCanvas({
  boxRef,
  canvasRef,
  live,
  photo,
  priority = false,
  className = "",
}: {
  boxRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  live: boolean;
  photo: StagePhoto;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div
        className={`absolute inset-0 grid place-items-center transition-opacity duration-500 ${live ? "pointer-events-none opacity-0" : "opacity-100"}`}
      >
        <Photo
          src={photo.url}
          alt={live ? "" : photo.alt}
          priority={priority}
          sizes="(min-width: 768px) 420px, 80vw"
          className="w-[min(78%,340px)]"
        />
      </div>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full cursor-grab touch-pan-y transition-opacity duration-700 active:cursor-grabbing ${live ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

const DARK =
  "radial-gradient(110% 80% at 70% 60%, #2c4a37 0%, #16271b 48%, #0e1912 100%)";
const eyebrowDark =
  "text-xs font-semibold tracking-widest text-[#fed216] uppercase";
const primary =
  "inline-flex min-h-11 items-center rounded-full bg-[#f9630e] px-6 font-semibold text-[#1c1206] active:scale-[0.97]";
const ghost =
  "inline-flex min-h-11 items-center rounded-full border border-[#faf6ee]/40 px-6 font-medium text-[#faf6ee] active:scale-[0.97]";

/** 1. Abertura: a caixa do BOX se enche de frutas e verduras. */
export function HeroStage({ photo }: { photo: StagePhoto }) {
  const { boxRef, canvasRef, live } = useStage("box");
  return (
    <section
      aria-label="Apresentação"
      className="relative overflow-hidden text-[#faf6ee]"
      style={{ background: DARK }}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-2 px-4 pt-10 sm:px-6 md:grid-cols-[1fr_1.05fr] md:gap-6 md:py-10">
        <div className="relative z-10 flex flex-col gap-4">
          <p className={eyebrowDark}>Horta · Cozinha · Casa</p>
          <h1 className="text-4xl text-[#faf6ee] sm:text-6xl">
            Alimentar é uma forma de <em className="text-[#cfe3a6]">cuidar.</em>
          </h1>
          <p className="max-w-md text-base text-[#faf6ee]/80 sm:text-lg">
            Da nossa horta e da cozinha da Chef Angela para a sua mesa, numa
            caixa montada para a sua casa.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/box" className={primary}>
              Montar meu BOX
            </Link>
            <Link href="/loja" className={ghost}>
              Ver a loja
            </Link>
          </div>
        </div>
        <StageCanvas
          boxRef={boxRef}
          canvasRef={canvasRef}
          live={live}
          photo={photo}
          priority
          className="h-[46svh] min-h-[300px] md:h-[min(70svh,560px)]"
        />
      </div>
    </section>
  );
}

/** 2. Salada no pote: a pessoa tira e coloca os ingredientes. */
export function SaladStage({ photo }: { photo: StagePhoto }) {
  const { boxRef, canvasRef, live, inJar, toggle } = useStage("salad");
  return (
    <section
      aria-labelledby="monte-do-seu-jeito"
      className="mx-auto max-w-6xl px-4 pt-20 sm:px-6"
    >
      {/* No celular o pote fica entre o título e os botões, para a pessoa ver
          o ingrediente entrar e sair enquanto toca. */}
      <div className="bg-sand-200/60 grid gap-x-6 gap-y-3 overflow-hidden rounded-(--radius-media) px-6 py-8 sm:px-10 md:grid-cols-2 md:grid-rows-[auto_1fr]">
        <div className="flex flex-col gap-3 md:self-end">
          <p className="text-leaf-700 text-xs font-medium tracking-widest uppercase">
            Salada no pote
          </p>
          <h2 id="monte-do-seu-jeito" className="text-3xl sm:text-5xl">
            Monte do seu jeito.
          </h2>
          <p className="text-ink-600 max-w-md sm:text-lg">
            {live &&
              "Role para montar e toque nos ingredientes para tirar ou colocar. "}
            Aqui a comida é pensada para você.
          </p>
        </div>
        <StageCanvas
          boxRef={boxRef}
          canvasRef={canvasRef}
          live={live}
          photo={photo}
          className="h-[44svh] min-h-[300px] md:col-start-2 md:row-span-2 md:row-start-1 md:h-[min(72svh,580px)]"
        />
        <div className="flex flex-col gap-4 md:self-start">
          {live && (
            <>
              <ul
                aria-label="Ingredientes da salada"
                className="flex max-w-md flex-wrap gap-2"
              >
                {STAGE_INGREDIENTS.map((ing, i) => (
                  <li key={ing.id}>
                    <button
                      type="button"
                      aria-pressed={inJar[i]}
                      onClick={() => toggle(ing.id)}
                      className="border-ink-600/40 text-ink-600 min-h-9 rounded-full border px-3 text-sm font-medium transition-colors duration-300"
                      style={
                        inJar[i]
                          ? {
                              background: ing.color,
                              borderColor: ing.color,
                              color: "#12200f",
                            }
                          : undefined
                      }
                    >
                      {ing.label}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-ink-600 text-xs">
                Ilustração 3D. Os ingredientes de cada semana aparecem na loja.
              </p>
            </>
          )}
          <div>
            <Link
              href="/loja"
              className="bg-forest-900 text-cream-50 hover:bg-forest-700 inline-flex min-h-11 items-center rounded-full px-6 font-medium"
            >
              Ver a loja
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 3. Farofa: o pote transparente abre e mostra a farofa. */
export function FarofaStage({ photo }: { photo: StagePhoto }) {
  const { boxRef, canvasRef, live } = useStage("farofa");
  return (
    <section
      aria-labelledby="farofa-nutritiva"
      className="mx-auto max-w-6xl px-4 pt-20 sm:px-6"
    >
      <div
        className="grid items-center gap-2 overflow-hidden rounded-(--radius-media) px-6 pt-8 text-[#faf6ee] sm:px-10 md:grid-cols-2 md:py-6"
        style={{ background: DARK }}
      >
        <div className="flex flex-col gap-4">
          <p className={eyebrowDark}>Produtos da Emkasa</p>
          <h2
            id="farofa-nutritiva"
            className="text-3xl text-[#faf6ee] sm:text-5xl"
          >
            Farofa Nutritiva de Soja
          </h2>
          <p className="max-w-md text-[#faf6ee]/80 sm:text-lg">
            {live && "Arraste para girar o pote e veja a farofa por dentro. "}
            Feita aqui, para a sua despensa.
          </p>
          <div>
            <Link href="/loja?secao=produtos-da-emkasa" className={primary}>
              Ver produtos da Emkasa
            </Link>
          </div>
        </div>
        <StageCanvas
          boxRef={boxRef}
          canvasRef={canvasRef}
          live={live}
          photo={photo}
          className="h-[48svh] min-h-[320px] md:h-[min(66svh,520px)]"
        />
      </div>
    </section>
  );
}
