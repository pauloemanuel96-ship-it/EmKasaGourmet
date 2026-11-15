import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton } from "@/components/admin/catalogo/action-button";
import { Badge, buttonPrimary } from "@/components/admin/catalogo/fields";
import { AdminPage } from "@/components/admin/page-shell";
import { setCategoryActive } from "@/modules/catalogo/actions";
import {
  countProductsByCategory,
  listCategories,
} from "@/modules/catalogo/admin-queries";
import { flattenTree } from "@/modules/catalogo/tree";
import { CATEGORY_KIND_LABEL } from "@/modules/catalogo/types";

export const metadata: Metadata = { title: "Categorias" };

export default function CategoriasPage() {
  return (
    <AdminPage roles={["owner", "admin"]}>
      <CategoryTree />
    </AdminPage>
  );
}

async function CategoryTree() {
  const [categories, counts] = await Promise.all([
    listCategories(),
    countProductsByCategory(),
  ]);
  const nodes = flattenTree(categories);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Categorias</h1>
          <p className="text-ink-600">
            As categorias de primeiro nível são as seções da loja. Desativar
            esconde a categoria e tudo dentro dela, sem apagar nada.
          </p>
        </div>
        <Link href="/admin/categorias/nova" className={buttonPrimary}>
          Nova categoria
        </Link>
      </header>

      {nodes.length === 0 ? (
        <p className="text-ink-600">Nenhuma categoria cadastrada.</p>
      ) : (
        <ul className="border-sand-200 bg-paper divide-sand-200 divide-y rounded-(--radius-media) border">
          {nodes.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              style={{ paddingInlineStart: `${1 + c.depth * 1.5}rem` }}
            >
              <div className="flex min-w-0 flex-col gap-1">
                <Link
                  href={`/admin/categorias/${c.id}`}
                  className={`font-medium underline-offset-2 hover:underline ${
                    c.depth === 0 ? "font-serif text-lg" : ""
                  } ${c.visible ? "" : "text-ink-600"}`}
                >
                  {c.depth > 0 && (
                    <span aria-hidden className="text-ink-600 mr-1">
                      ↳
                    </span>
                  )}
                  {c.name}
                </Link>
                <div className="flex flex-wrap gap-1.5">
                  {c.depth === 0 && (
                    <Badge tone={c.kind === "encomendas" ? "warn" : "neutral"}>
                      {CATEGORY_KIND_LABEL[c.kind]}
                    </Badge>
                  )}
                  {c.is_featured && <Badge tone="ok">Destaque</Badge>}
                  {!c.is_active && <Badge tone="muted">Inativa</Badge>}
                  {c.is_active && !c.visible && (
                    <Badge tone="muted">Oculta pela categoria-mãe</Badge>
                  )}
                  <span className="text-ink-600 text-xs">
                    {counts.get(c.id) ?? 0} produto(s)
                    {c.childCount > 0 && ` · ${c.childCount} subcategoria(s)`}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Link
                  href={`/admin/categorias/nova?mae=${c.id}`}
                  className="text-forest-900 flex min-h-11 items-center px-2 text-sm font-medium underline underline-offset-2"
                >
                  Subcategoria
                </Link>
                <ActionButton
                  action={setCategoryActive.bind(null, c.id, !c.is_active)}
                  label={c.is_active ? "Desativar" : "Ativar"}
                  confirm={
                    c.is_active && c.childCount > 0
                      ? `Desativar "${c.name}" esconde também as subcategorias e os produtos dentro dela. Continuar?`
                      : undefined
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
