"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Photo } from "@/components/loja/photo";
import { STAGE_BEATS, STAGE_INGREDIENTS } from "./ingredients";
import type { StageHandle } from "./scene";

type StagePhoto = { url: string; alt: string };

/** [início, fim] de cada painel de texto no scroll do palco (0 a 1). */
const PANEL_RANGES: [number, number][] = [
  [-1, STAGE_BEATS.heroEnd],
  [STAGE_BEATS.saladStart, STAGE_BEATS.saladEnd],
  [STAGE_BEATS.farofaStart, 2],
];

const ASSETS = {
  labelA: "/fotos/3d/rotulo-farofa-a.webp",
  labelB: "/fotos/3d/rotulo-farofa-b.webp",
  farofa: "/fotos/3d/farofa-textura.webp",
};

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

function canRun3D() {
  try {
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean };
      deviceMemory?: number;
    };
    if (nav.connection?.saveData) return false;
    if (nav.deviceMemory !== undefined && nav.deviceMemory < 3) return false;
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2"));
  } catch {
    return false;
  }
}

/**
 * Abertura da home (D-034). Sem JavaScript, sem WebGL ou em aparelho fraco,
 * é uma seção comum com texto e fotos reais. Quando o 3D carrega, vira um palco
 * fixo em que o scroll monta a salada e depois mostra o pote da Farofa.
 */
export function HomeStage({
  saladPhoto,
  saladPhotoAlt,
  farofaPhoto,
}: {
  saladPhoto: StagePhoto;
  /** Segunda foto da salada, usada só na versão sem 3D. */
  saladPhotoAlt: StagePhoto;
  farofaPhoto: StagePhoto;
}) {
  const stageRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const handleRef = useRef<StageHandle | null>(null);
  const [live, setLive] = useState(false);
  const [inJar, setInJar] = useState<boolean[]>(() =>
    STAGE_INGREDIENTS.map(() => false),
  );

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas || !canRun3D()) return;
    // Se a pessoa já rolou a página, trocar o layout agora faria o conteúdo pular.
    if (window.scrollY > stage.offsetTop + 240) return;

    let cancelled = false;
    let handle: StageHandle | null = null;
    let frame = 0;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const update = () => {
      frame = 0;
      if (!handle) return;
      const rect = stage.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0;
      handle.setProgress(p);
      panelRefs.current.forEach((el, i) => {
        if (!el) return;
        const [a, b] = PANEL_RANGES[i];
        const o = Math.min(smooth((p - a) / 0.035), smooth((b - p) / 0.035));
        el.style.opacity = o.toFixed(3);
        el.style.visibility = o > 0.01 ? "visible" : "hidden";
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      handle?.resize();
      onScroll();
    };
    const visibility = new IntersectionObserver(([entry]) => {
      handle?.setActive(entry.isIntersecting);
    });

    import("./scene")
      .then(({ createStage }) => {
        if (cancelled) return;
        stage.dataset.mode = "live";
        handle = createStage(canvas, {
          assets: ASSETS,
          reducedMotion,
          onState: (state) => setInJar(state),
        });
        handleRef.current = handle;
        setLive(true);
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onResize);
        visibility.observe(stage);
        update();
      })
      .catch(() => {
        // Falhou ao criar a cena: fica a versão com fotos.
        delete stage.dataset.mode;
      });

    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      visibility.disconnect();
      handle?.dispose();
      handleRef.current = null;
      delete stage.dataset.mode;
    };
  }, []);

  const panel =
    "mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 group-data-[mode=live]/stage:pointer-events-none group-data-[mode=live]/stage:absolute group-data-[mode=live]/stage:inset-0 group-data-[mode=live]/stage:flex group-data-[mode=live]/stage:max-w-none group-data-[mode=live]/stage:items-start group-data-[mode=live]/stage:py-0 group-data-[mode=live]/stage:pt-24 md:group-data-[mode=live]/stage:items-center md:group-data-[mode=live]/stage:pt-0";
  const inner =
    "flex flex-col gap-4 group-data-[mode=live]/stage:pointer-events-auto group-data-[mode=live]/stage:mx-auto group-data-[mode=live]/stage:w-full group-data-[mode=live]/stage:max-w-6xl md:group-data-[mode=live]/stage:pr-[52%]";
  const eyebrow =
    "text-xs font-semibold tracking-widest text-[#fed216] uppercase";
  const lead = "max-w-md text-base text-[#faf6ee]/80 sm:text-lg";
  const primary =
    "inline-flex min-h-11 items-center rounded-full bg-[#f9630e] px-6 font-semibold text-[#1c1206] active:scale-[0.97]";
  const ghost =
    "inline-flex min-h-11 items-center rounded-full border border-[#faf6ee]/40 px-6 font-medium text-[#faf6ee] active:scale-[0.97]";
  const fallbackPhoto = "mt-4 max-w-xs group-data-[mode=live]/stage:hidden";

  return (
    <section
      ref={stageRef}
      aria-label="Apresentação"
      className="group/stage relative bg-[#0e1912] text-[#faf6ee] data-[mode=live]:h-[520svh]"
    >
      <div className="group-data-[mode=live]/stage:sticky group-data-[mode=live]/stage:top-0 group-data-[mode=live]/stage:h-svh group-data-[mode=live]/stage:overflow-hidden">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 hidden h-full w-full cursor-grab touch-pan-y group-data-[mode=live]/stage:block active:cursor-grabbing"
        />

        {/* 1. Abertura */}
        <div
          ref={(el) => {
            panelRefs.current[0] = el;
          }}
          className={panel}
        >
          <div className={inner}>
            <p className={eyebrow}>Horta · Cozinha · Casa</p>
            <h1 className="text-4xl text-[#faf6ee] sm:text-6xl">
              Alimentar é uma forma de{" "}
              <em className="text-[#cfe3a6]">cuidar.</em>
            </h1>
            <p className={lead}>
              Da nossa horta e da cozinha da Chef Angela para a sua mesa.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/box" className={primary}>
                Montar meu BOX
              </Link>
              <Link href="/loja" className={ghost}>
                Ver a loja
              </Link>
            </div>
            <p
              aria-hidden="true"
              className="hidden text-sm text-[#faf6ee]/65 group-data-[mode=live]/stage:block"
            >
              Role para montar a salada ↓
            </p>
            <Photo
              src={saladPhoto.url}
              alt={saladPhoto.alt}
              priority
              sizes="320px"
              className={fallbackPhoto}
            />
          </div>
        </div>

        {/* 2. Salada: monte do seu jeito */}
        <div
          ref={(el) => {
            panelRefs.current[1] = el;
          }}
          className={`${panel} group-data-[mode=live]/stage:invisible group-data-[mode=live]/stage:opacity-0`}
        >
          <div className={inner}>
            <p className={eyebrow}>Salada no pote</p>
            <h2 className="text-3xl text-[#faf6ee] sm:text-5xl">
              Monte do seu jeito.
            </h2>
            <p className={lead}>
              <span className="hidden group-data-[mode=live]/stage:inline">
                Toque nos ingredientes para tirar ou colocar.{" "}
              </span>
              Aqui a comida é pensada para você.
            </p>
            <ul
              aria-label="Ingredientes da salada"
              className="hidden max-w-md flex-wrap gap-2 group-data-[mode=live]/stage:flex"
            >
              {STAGE_INGREDIENTS.map((ing, i) => (
                <li key={ing.id}>
                  <button
                    type="button"
                    aria-pressed={inJar[i]}
                    disabled={!live}
                    onClick={() => handleRef.current?.toggle(ing.id)}
                    className="min-h-9 rounded-full border px-3 text-sm font-medium transition-colors duration-300"
                    style={
                      inJar[i]
                        ? {
                            background: ing.color,
                            borderColor: ing.color,
                            color: "#12200f",
                          }
                        : {
                            borderColor: "rgba(250,246,238,.3)",
                            color: "rgba(250,246,238,.6)",
                          }
                    }
                  >
                    {ing.label}
                  </button>
                </li>
              ))}
            </ul>
            <p className="hidden text-xs text-[#faf6ee]/55 group-data-[mode=live]/stage:block">
              Ilustração 3D. Os ingredientes de cada semana aparecem na loja.
            </p>
            <Photo
              src={saladPhotoAlt.url}
              alt={saladPhotoAlt.alt}
              sizes="320px"
              className={fallbackPhoto}
            />
          </div>
        </div>

        {/* 3. Farofa */}
        <div
          ref={(el) => {
            panelRefs.current[2] = el;
          }}
          className={`${panel} group-data-[mode=live]/stage:invisible group-data-[mode=live]/stage:opacity-0`}
        >
          <div className={inner}>
            <p className={eyebrow}>Produtos da Emkasa</p>
            <h2 className="text-3xl text-[#faf6ee] sm:text-5xl">
              Farofa Nutritiva de Soja
            </h2>
            <p className={lead}>
              <span className="hidden group-data-[mode=live]/stage:inline">
                Arraste para girar o pote e veja a farofa por dentro.{" "}
              </span>
              Feita aqui, para a sua despensa.
            </p>
            <div>
              <Link href="/loja?secao=produtos-da-emkasa" className={primary}>
                Ver produtos da Emkasa
              </Link>
            </div>
            <Photo
              src={farofaPhoto.url}
              alt={farofaPhoto.alt}
              ratio="4/3"
              sizes="320px"
              className={fallbackPhoto}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
