"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Compartilhar (D-051). No celular abre o compartilhamento do próprio aparelho
 * (WhatsApp, Instagram, o que a pessoa tiver); onde não existe, mostra
 * WhatsApp, Facebook e copiar link. O link leva a marca de origem
 * "compartilhar", para o Radar da loja saber de onde veio a visita.
 */
export function ShareButton({
  title,
  text,
  path,
  tone = "light",
  className = "",
}: {
  title: string;
  text: string;
  /** Caminho da página, começando com "/". */
  path: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function link(medium: string) {
    const url = new URL(path, window.location.origin);
    url.searchParams.set("utm_source", "compartilhar");
    url.searchParams.set("utm_medium", medium);
    return url.toString();
  }

  async function share() {
    const nav = navigator as Navigator & {
      share?: (d: ShareData) => Promise<void>;
    };
    if (typeof nav.share === "function") {
      try {
        await nav.share({ title, text, url: link("nativo") });
        return;
      } catch (e) {
        // Cancelou: não faz nada. Outro erro: cai na lista.
        if ((e as Error).name === "AbortError") return;
      }
    }
    setOpen((v) => !v);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link("link"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sem área de transferência: a pessoa ainda tem os outros botões.
    }
  }

  const dark = tone === "dark";
  const item =
    "flex min-h-11 w-full items-center gap-3 rounded-(--radius-control) px-3 text-left text-sm hover:bg-black/5";

  return (
    <div ref={boxRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={share}
        aria-expanded={open}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium backdrop-blur-sm transition ${dark ? "border-[#faf3e6]/35 bg-[#0b0907]/30 text-[#faf3e6] hover:bg-[#faf3e6]/10" : "border-sand-200 text-forest-900 hover:bg-sand-200"}`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 15V4m0 0L8 8m4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
        </svg>
        Compartilhar
      </button>
      {open && (
        <div
          role="menu"
          className="bg-cream-50 text-forest-900 border-sand-200 absolute left-0 z-40 mt-2 w-56 rounded-(--radius-media) border p-2 shadow-2xl"
        >
          <a
            role="menuitem"
            href={`https://wa.me/?text=${encodeURIComponent(`${text} ${typeof window === "undefined" ? "" : link("whatsapp")}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={item}
          >
            <span
              aria-hidden="true"
              className="grid size-7 place-items-center rounded-full bg-[#25d366] text-xs font-bold text-white"
            >
              W
            </span>
            WhatsApp
          </a>
          <a
            role="menuitem"
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window === "undefined" ? "" : link("facebook"))}`}
            target="_blank"
            rel="noopener noreferrer"
            className={item}
          >
            <span
              aria-hidden="true"
              className="grid size-7 place-items-center rounded-full bg-[#1877f2] text-xs font-bold text-white"
            >
              f
            </span>
            Facebook
          </a>
          <button role="menuitem" type="button" onClick={copy} className={item}>
            <span
              aria-hidden="true"
              className="bg-sand-200 grid size-7 place-items-center rounded-full"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
              </svg>
            </span>
            <span aria-live="polite">
              {copied ? "Link copiado!" : "Copiar link"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
