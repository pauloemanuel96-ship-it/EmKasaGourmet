import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton } from "@/components/admin/catalogo/action-button";
import {
  Badge,
  buttonPrimary,
  buttonSecondary,
  inputClass,
} from "@/components/admin/catalogo/fields";
import { AdminPage } from "@/components/admin/page-shell";
import { formatCents } from "@/lib/money";
import { getCurrentUser } from "@/modules/auth/staff";
import { setProductStatus } from "@/modules/catalogo/actions";
import { listCategories, listProducts } from "@/modules/catalogo/admin-queries";
import { flattenTree } from "@/modules/catalogo/tree";
import {
  PRODUCT_STATUSES,
  PRODUCT_STATUS_LABEL,
  SALE_UNIT_LABEL,
  type ProductListItem,
  type ProductStatus,
} from "@/modules/catalogo/types";

export const metadata: Metadata = { title: "Produtos" };

export default function ProdutosPage({
  searchParams,
}: PageProps<"/admin/produtos">) {
  return (
    <AdminPage roles={["owner", "admin", "operacao"]}>
      <ProductList searchParams={searchParams} />
    </AdminPage>
  );
}

const STATUS_TONE: Record<ProductStatus, "ok" | "neutral" | "muted"> = {
  active: "ok",
  draft: "neutral",
  archived: "muted",
};

function priceLabel(p: ProductListItem) {
  if (p.price_cents !== null) {
    return `${formatCents(p.price_cents)} / ${SALE_UNIT_LABEL[p.sale_unit].toLowerCase()}`;
  }
  return p.quote_only ? "Sob orçamento" : "Sem preço";
}

async function ProductList({
  searchParams,
}: {
  searchParams: PageProps<"/admin/produtos">["searchParams"];
}) {
  const [sp, user, categories] = await Promise.all([
    searchParams,
    getCurrentUser(),
    listCategories(),
  ]);
  const isManager = user?.role === "owner" || user?.role === "admin";

  const status = PRODUCT_STATUSES.find((s) => s === sp.situacao);
  const categoryId =
    typeof sp.categoria === "string" &&
    categories.some((c) => c.id === sp.categoria)
      ? sp.categoria
      : undefined;
  const query =
    typeof sp.q === "string" && sp.q.trim() ? sp.q.trim().slice(0, 80) : "";

  const nodes = flattenTree(categories);
  const pathOf = new Map(nodes.map((n) => [n.id, n.path.join(" › ")]));
  const products = await listProducts(
    { status, categoryId, query: query || undefined },
    categories,
  );
  const filtered = Boolean(status || categoryId || query);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Produtos</h1>
          <p className="text-ink-600">
            Cada sabor ou variedade é um produto dentro da sua subcategoria.
          </p>
        </div>
        <Link href="/admin/produtos/novo" className={buttonPrimary}>
          {isManager ? "Novo produto" : "Novo rascunho"}
        </Link>
      </header>

      {sp.rascunho === "1" && (
        <p role="status" className="bg-sand-200 rounded-(--radius-control) p-3">
          Rascunho salvo. A administração completa a ficha e publica.
        </p>
      )}

      <form
        method="get"
        className="border-sand-200 bg-paper grid gap-3 rounded-(--radius-media) border p-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="q" className="text-sm font-medium">
            Buscar pelo nome
          </label>
          <input id="q" name="q" defaultValue={query} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="categoria" className="text-sm font-medium">
            Categoria
          </label>
          <select
            id="categoria"
            name="categoria"
            defaultValue={categoryId ?? ""}
            className={inputClass}
          >
            <option value="">Todas</option>
            {nodes.map((c) => (
              <option key={c.id} value={c.id}>
                {"— ".repeat(c.depth)}
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="situacao" className="text-sm font-medium">
            Situação
          </label>
          <select
            id="situacao"
            name="situacao"
            defaultValue={status ?? ""}
            className={inputClass}
          >
            <option value="">Todas</option>
            {PRODUCT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PRODUCT_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className={buttonSecondary}>
            Filtrar
          </button>
          {filtered && (
            <Link
              href="/admin/produtos"
              className="text-ink-600 flex min-h-11 items-center px-2 text-sm underline"
            >
              Limpar
            </Link>
          )}
        </div>
      </form>

      {products.length === 0 ? (
        <p className="text-ink-600">
          {filtered
            ? "Nenhum produto com esses filtros."
            : "Nenhum produto cadastrado ainda. Comece pelo botão acima."}
        </p>
      ) : (
        <ul className="border-sand-200 bg-paper divide-sand-200 divide-y rounded-(--radius-media) border">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 flex-col gap-1">
                {isManager ? (
                  <Link
                    href={`/admin/produtos/${p.id}`}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {p.name}
                  </Link>
                ) : (
                  <span className="font-medium">{p.name}</span>
                )}
                <span className="text-ink-600 text-sm">
                  {(p.category_id && pathOf.get(p.category_id)) ??
                    "Sem categoria"}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={STATUS_TONE[p.status]}>
                    {PRODUCT_STATUS_LABEL[p.status]}
                  </Badge>
                  <span className="text-sm tabular-nums">{priceLabel(p)}</span>
                  {!p.allergens_validated_at && p.status !== "archived" && (
                    <Badge tone="warn">Ficha não validada</Badge>
                  )}
                </div>
              </div>
              {isManager && (
                <div className="flex flex-wrap items-center gap-1">
                  {p.status !== "active" && (
                    <ActionButton
                      action={setProductStatus.bind(null, p.id, "active")}
                      label="Pôr à venda"
                    />
                  )}
                  {p.status === "active" && (
                    <ActionButton
                      action={setProductStatus.bind(null, p.id, "draft")}
                      label="Tirar da loja"
                    />
                  )}
                  {p.status !== "archived" && (
                    <ActionButton
                      action={setProductStatus.bind(null, p.id, "archived")}
                      label="Arquivar"
                      confirm={`Arquivar "${p.name}"? Ele sai da loja e pode ser recuperado depois.`}
                    />
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
