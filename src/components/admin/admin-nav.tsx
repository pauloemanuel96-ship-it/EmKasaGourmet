"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { StaffRole } from "@/modules/auth/staff";

const ALL: StaffRole[] = ["owner", "admin", "operacao", "atendimento"];
const MANAGERS: StaffRole[] = ["owner", "admin"];

/**
 * Menu por papel (D-048). Cada item aparece só para quem a página aceita; a
 * página confere de novo no servidor. O dono vê tudo, inclusive Tráfego.
 */
const ITEMS: { href: string; label: string; roles: StaffRole[] }[] = [
  { href: "/admin", label: "Início", roles: ALL },
  { href: "/admin/trafego", label: "Tráfego", roles: ["owner"] },
  { href: "/admin/hoje", label: "Hoje", roles: ALL },
  { href: "/admin/pedidos", label: "Pedidos", roles: ALL },
  {
    href: "/admin/produtos",
    label: "Produtos",
    roles: ["owner", "admin", "operacao"],
  },
  { href: "/admin/midia", label: "Fotos", roles: MANAGERS },
  { href: "/admin/categorias", label: "Categorias", roles: MANAGERS },
  { href: "/admin/ingredientes", label: "Ingredientes", roles: MANAGERS },
  { href: "/admin/campanhas", label: "Campanhas", roles: MANAGERS },
  { href: "/admin/clientes", label: "Clientes", roles: MANAGERS },
  { href: "/admin/leads", label: "Contatos", roles: MANAGERS },
  { href: "/admin/chef", label: "Chef Emkasa", roles: MANAGERS },
  { href: "/admin/configuracoes", label: "Configurações", roles: MANAGERS },
  { href: "/admin/assistente", label: "Assistente", roles: ALL },
];

export function menuFor(role: StaffRole | null) {
  return role ? ITEMS.filter((i) => i.roles.includes(role)) : [];
}

export function AdminNav({ role }: { role: StaffRole | null }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Painel" className="flex gap-1 overflow-x-auto">
      {menuFor(role).map((i) => {
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
