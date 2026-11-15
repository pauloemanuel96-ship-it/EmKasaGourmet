"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = {
  href: string;
  label: string;
  /** Caminho SVG (24x24, traço). */
  icon: string;
  match: (path: string) => boolean;
  /** Item em destaque (cor da marca mesmo sem estar ativo). */
  highlight?: boolean;
};

const ITEMS: Item[] = [
  {
    href: "/",
    label: "Início",
    icon: "M4 11.5 12 4l8 7.5M6 10v9h12v-9",
    match: (p) => p === "/",
  },
  {
    href: "/loja",
    label: "Loja",
    icon: "M5 8h14l-1 12H6L5 8Zm4 0V7a3 3 0 0 1 6 0v1",
    match: (p) => p.startsWith("/loja") || p.startsWith("/produto"),
  },
  {
    href: "/box",
    label: "BOX",
    icon: "M4 8l8-4 8 4v8l-8 4-8-4V8Zm0 0 8 4 8-4M12 12v8",
    match: (p) => p.startsWith("/box"),
  },
  {
    href: "/encomendas",
    label: "Encomendas",
    // Presente: caixa com laço.
    icon: "M4 10h16v10H4V10Zm-1-3h18v3H3V7Zm9 0v13M12 7c-1.5-3-5-3-5-1s3 1 5 1Zm0 0c1.5-3 5-3 5-1s-3 1-5 1Z",
    match: (p) => p.startsWith("/encomendas"),
    highlight: true,
  },
  {
    href: "/minha-casa",
    label: "Minha Casa",
    icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
    match: (p) => p.startsWith("/minha-casa") || p.startsWith("/clube"),
  },
];

/** Barra de navegação inferior: só no celular (no desktop vale o menu do topo). */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Principal"
      className="border-sand-200 bg-cream-50/95 pb-safe fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`${item.highlight ? "text-terracotta-500" : "text-ink-600"} aria-[current=page]:text-forest-900 flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-transform active:scale-95`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={active ? 2 : 1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={item.icon} />
                </svg>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
