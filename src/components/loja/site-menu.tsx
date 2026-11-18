"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HOME_CAMPAIGN } from "@/modules/campanhas/home-campaign";

type Entry = {
  href: string;
  label: string;
  text: string;
  /** Caminho SVG 24x24, traço. */
  icon: string;
  gold?: boolean;
};

const GROUPS: { title: string; items: Entry[] }[] = [
  {
    title: "Comprar",
    items: [
      {
        href: "/loja",
        label: "Loja",
        text: "Produtos da Emkasa, horta e congelados",
        icon: "M5 8h14l-1 12H6L5 8Zm4 0V7a3 3 0 0 1 6 0v1",
      },
      {
        href: "/box",
        label: "BOX",
        text: "Monte a caixa da semana para a sua casa",
        icon: "M4 8l8-4 8 4v8l-8 4-8-4V8Zm0 0 8 4 8-4M12 12v8",
      },
      {
        href: "/encomendas",
        label: "Encomendas",
        text: "Ceias, confraternizações e datas especiais",
        icon: "M4 10h16v10H4V10Zm-1-3h18v3H3V7Zm9 0v13M12 7c-1.5-3-5-3-5-1s3 1 5 1Zm0 0c1.5-3 5-3 5-1s-3 1-5 1Z",
      },
      ...(HOME_CAMPAIGN === "natal"
        ? [
            {
              href: "/natal",
              label: "Natal Emkasa",
              text: "A ceia natural para quem senta à mesa",
              icon: "M12 3l6 9h-3l4 6H5l4-6H6l6-9Zm0 15v3",
              gold: true,
            },
          ]
        : []),
    ],
  },
  {
    title: "Serviços",
    items: [
      {
        href: "/chef-emkasa",
        label: "Chef em casa",
        text: "A Chef cozinhando na sua casa",
        icon: "M7 13a4 4 0 1 1 1.5-7.7A4.5 4.5 0 0 1 17 6a3.5 3.5 0 0 1 0 7v6H7v-6Zm0 3h10",
        gold: true,
      },
    ],
  },
  {
    title: "Aprender",
    items: [
      {
        href: "/receitas",
        label: "Receitas",
        text: "Comida de verdade, passo a passo",
        icon: "M6 4h10a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2V4Zm0 14a2 2 0 0 1 2-2h10M10 8h5M10 11h5",
      },
      {
        href: "/escola",
        label: "Escola",
        text: "Cursos com a Chef",
        icon: "M3 9l9-4 9 4-9 4-9-4Zm4 2v5c3 2 7 2 10 0v-5",
      },
      {
        href: "/clube",
        label: "Clube",
        text: "Vantagens para quem é da casa",
        icon: "M12 4l2.5 5 5.5.8-4 3.9.9 5.5L12 16.6 7.1 19.2l.9-5.5-4-3.9 5.5-.8L12 4Z",
      },
    ],
  },
  {
    title: "Sua conta",
    items: [
      {
        href: "/minha-casa",
        label: "Minha Casa",
        text: "Sua família, endereços e preferências",
        icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
      },
      {
        href: "/carrinho",
        label: "Carrinho",
        text: "O que você separou para levar",
        icon: "M4 5h2l2 11h10l2-8H7M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
      },
    ],
  },
];

/**
 * Menu completo do site (D-051): no computador é o "Explorar", no celular é o
 * "Menu" ao lado do carrinho. Agrupa tudo o que não cabe no topo nem na barra
 * de baixo. Fecha com Esc, tocando fora ou ao trocar de página.
 */
export function SiteMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Trocou de página: fecha.
  const [seen, setSeen] = useState(pathname);
  if (seen !== pathname) {
    setSeen(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="menu-completo"
        onClick={() => setOpen((v) => !v)}
        className="text-forest-900 hover:bg-sand-200 flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-(--radius-control) px-2 text-sm font-medium md:px-3"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5 md:hidden"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          {open ? (
            <path d="M6 6l12 12M18 6 6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h10" />
          )}
        </svg>
        <span className="sr-only md:not-sr-only">
          {open ? "Fechar" : "Explorar"}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`hidden size-4 transition-transform md:block ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
        <span className="sr-only md:hidden">{open ? "" : "Menu"}</span>
      </button>

      {open && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="menu-backdrop absolute inset-x-0 top-full h-[100svh] bg-[#0b0907]/35 backdrop-blur-[2px]"
          />
          <div
            id="menu-completo"
            ref={panelRef}
            role="dialog"
            aria-label="Menu do site"
            className="menu-panel border-sand-200 bg-cream-50 absolute inset-x-0 top-full max-h-[calc(100svh-5rem)] overflow-y-auto border-b shadow-2xl"
          >
            <span aria-hidden="true" className="fit-scan" />
            <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-6 pb-28 sm:px-6 md:grid-cols-4 md:py-8">
              {GROUPS.map((g) => (
                <section key={g.title} aria-label={g.title}>
                  <p className="text-leaf-700 mb-3 text-xs font-semibold tracking-[0.2em] uppercase">
                    {g.title}
                  </p>
                  <ul className="flex flex-col gap-1">
                    {g.items.map((i) => {
                      const here =
                        i.href === pathname ||
                        (i.href !== "/" && pathname.startsWith(i.href));
                      return (
                        <li key={i.href}>
                          <Link
                            href={i.href}
                            onClick={() => setOpen(false)}
                            aria-current={here ? "page" : undefined}
                            className="menu-item hover:bg-sand-200/70 aria-[current=page]:bg-sand-200 flex min-h-14 items-center gap-3 rounded-(--radius-control) px-3 py-2"
                          >
                            <span
                              aria-hidden="true"
                              className={`grid size-10 shrink-0 place-items-center rounded-full ${i.gold ? "text-[#8a5a12] shadow-[0_0_0_1px_#e2b93b,0_0_14px_rgba(254,210,22,0.35)]" : "text-forest-900 shadow-[0_0_0_1px_var(--color-sand-200)]"}`}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="size-5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d={i.icon} />
                              </svg>
                            </span>
                            <span className="flex flex-col">
                              <span className="text-forest-900 text-sm font-medium">
                                {i.label}
                              </span>
                              <span className="text-ink-600 text-xs">
                                {i.text}
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
