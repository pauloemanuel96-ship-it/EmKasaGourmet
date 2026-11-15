"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Início" },
  { href: "/admin/hoje", label: "Hoje" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/midia", label: "Fotos" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/ingredientes", label: "Ingredientes" },
  { href: "/admin/campanhas", label: "Campanhas" },
  { href: "/admin/configuracoes", label: "Configurações" },
  { href: "/admin/assistente", label: "Assistente" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Painel" className="flex gap-1 overflow-x-auto">
      {ITEMS.map((i) => {
        const active =
          i.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className="text-ink-600 hover:bg-sand-200 aria-[current=page]:bg-forest-900 aria-[current=page]:text-cream-50 flex min-h-11 shrink-0 items-center rounded-(--radius-control) px-3 text-sm font-medium"
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
