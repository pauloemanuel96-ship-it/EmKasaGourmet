"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = {
  href: string;
  label: string;
  /** Caminho SVG (24x24, traço). */
  icon: string;
  match: (path: string) => boolean;
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
    href: "/receitas",
    label: "Receitas",
    icon: "M6 4h11a1 1 0 0 1 1 1v15H7a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1Zm3 5h6M9 13h6",
    match: (p) => p.startsWith("/receitas"),
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
                className="text-ink-600 aria-[current=page]:text-forest-900 flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-transform active:scale-95"
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
