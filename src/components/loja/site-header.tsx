"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cartCount, useDemo } from "@/demo/store";

const NAV = [
  { href: "/loja", label: "Loja" },
  { href: "/box", label: "BOX" },
  { href: "/receitas", label: "Receitas" },
  { href: "/escola", label: "Escola" },
  { href: "/clube", label: "Clube" },
];

export function SiteHeader() {
  const count = useDemo(cartCount);
  const pathname = usePathname();

  return (
    <header className="border-sand-200 bg-cream-50/95 sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-forest-900 flex min-h-11 items-center gap-2 font-serif text-lg whitespace-nowrap sm:text-xl"
        >
          <Image
            src="/icons/mark-96.png"
            alt=""
            width={36}
            height={36}
            priority
          />
          <span>
            emKasa <span className="text-leaf-700">Gourmet</span>
          </span>
        </Link>

        <nav
          aria-label="Principal"
          className="hidden items-center gap-6 md:flex"
        >
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname.startsWith(n.href) ? "page" : undefined}
              className="text-ink-600 hover:text-forest-900 aria-[current=page]:text-forest-900 text-sm font-medium aria-[current=page]:underline aria-[current=page]:underline-offset-8"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/minha-casa"
            className="text-forest-900 hover:bg-sand-200 hidden min-h-11 items-center rounded-(--radius-control) px-3 text-sm font-medium sm:flex"
          >
            Minha Casa
          </Link>
          <Link
            href="/carrinho"
            className="bg-forest-900 text-cream-50 hover:bg-forest-700 flex min-h-11 items-center gap-2 rounded-(--radius-control) px-3 text-sm font-medium sm:px-4"
          >
            Carrinho
            <span
              aria-label={`${count} itens`}
              className="bg-cream-50 text-forest-900 min-w-6 rounded-full px-1.5 text-center text-xs"
            >
              {count}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
