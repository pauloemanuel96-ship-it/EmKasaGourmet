"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const BULBS = [
  "#ffd27a",
  "#ff5a4d",
  "#6bdf8a",
  "#ffd27a",
  "#58c8ff",
  "#ff8ad8",
];

/**
 * Chamada de Natal na home: neve em canvas 2D que desvia do dedo ou do mouse
 * e um varal de luzes. Leve de propósito (sem WebGL): o 3D fica na página /natal.
 */
export function NatalBanner() {
  const boxRef = useRef<HTMLAnchorElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    const g = canvas?.getContext("2d");
    if (!box || !canvas || !g) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;
    const mouse = { x: -999, y: -999 };
    const flakes = Array.from({ length: 70 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1 + Math.random() * 2.4,
      v: 0.03 + Math.random() * 0.06,
      p: Math.random() * 6.28,
      ox: 0,
      oy: 0,
    }));
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = box.clientWidth;
      h = box.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    let last = performance.now();
    const draw = (now: number) => {
      raf = 0;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      g.clearRect(0, 0, w, h);
      g.fillStyle = "rgba(255,255,255,.85)";
      for (const f of flakes) {
        if (!reduce) {
          f.y += f.v * dt;
          if (f.y > 1.05) {
            f.y = -0.05;
            f.x = Math.random();
          }
        }
        const x = f.x * w + Math.sin(now / 1400 + f.p) * 10;
        const y = f.y * h;
        const dx = x + f.ox - mouse.x;
        const dy = y + f.oy - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < 90 && d > 0.1) {
          f.ox += (dx / d) * (90 - d) * 0.12;
          f.oy += (dy / d) * (90 - d) * 0.12;
        }
        f.ox *= 0.94;
        f.oy *= 0.94;
        g.beginPath();
        g.arc(x + f.ox, y + f.oy, f.r, 0, Math.PI * 2);
        g.fill();
      }
      if (running && !reduce) raf = requestAnimationFrame(draw);
    };
    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      if (reduce && !raf) raf = requestAnimationFrame(draw);
    };
    const leave = () => {
      mouse.x = mouse.y = -999;
    };
    const visibility = new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting;
      if (running && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(draw);
      }
    });
    size();
    visibility.observe(box);
    window.addEventListener("resize", size);
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      visibility.disconnect();
      window.removeEventListener("resize", size);
      box.removeEventListener("pointermove", move);
      box.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <section
      aria-label="Natal Emkasa"
      className="mx-auto mt-10 max-w-6xl px-4 sm:px-6"
    >
      <Link
        ref={boxRef}
        href="/natal"
        className="group relative block overflow-hidden rounded-(--radius-media) px-6 pt-14 pb-8 text-[#faf6ee] sm:px-12 sm:pt-16 sm:pb-12"
        style={{
          background:
            "radial-gradient(90% 120% at 85% 20%, #7a1a22 0%, #3d1216 38%, #0f2419 100%)",
        }}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
        {/* varal de luzes */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 flex h-10 items-start justify-around px-3"
        >
          <span className="absolute inset-x-0 top-2 h-4 rounded-[50%] border-b border-[#faf6ee]/25" />
          {Array.from({ length: 14 }, (_, i) => (
            <span
              key={i}
              className="natal-bulb relative size-2.5 rounded-full sm:size-3"
              style={{
                marginTop: `${10 + Math.sin((i / 13) * Math.PI) * 9}px`,
                background: BULBS[i % BULBS.length],
                boxShadow: `0 0 12px 3px ${BULBS[i % BULBS.length]}`,
                animationDelay: `${(i % 5) * 0.37}s`,
              }}
            />
          ))}
        </span>
        <span className="relative flex max-w-xl flex-col gap-3">
          <span className="text-xs font-semibold tracking-widest text-[#f3dfa2] uppercase">
            Natal Emkasa
          </span>
          <span className="font-serif text-3xl leading-tight sm:text-5xl">
            A ceia deste ano já tem lugar.
          </span>
          <span className="text-[#faf6ee]/80 sm:text-lg">
            Ceia Natural Emkasa e Ceia Tradicional, sob encomenda.
          </span>
          <span className="mt-2 inline-flex min-h-11 w-fit items-center rounded-full bg-[#f3dfa2] px-6 font-semibold text-[#3d1216] transition-transform group-hover:translate-x-1 group-active:scale-[0.97]">
            Ver o Natal →
          </span>
        </span>
      </Link>
    </section>
  );
}
