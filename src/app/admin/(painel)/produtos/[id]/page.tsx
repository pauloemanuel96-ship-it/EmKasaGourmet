import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ActionButton } from "@/components/admin/catalogo/action-button";
import { Badge } from "@/components/admin/catalogo/fields";
import { ProductForm } from "@/components/admin/catalogo/product-form";
import { AdminPage } from "@/components/admin/page-shell";
import { validateProductAllergens } from "@/modules/catalogo/actions";
import {
  getProduct,
  getProductFormOptions,
  listCategories,
} from "@/modules/catalogo/admin-queries";
import { flattenTree } from "@/modules/catalogo/tree";
import { PRODUCT_STATUS_LABEL } from "@/modules/catalogo/types";

export const metadata: Metadata = { title: "Editar produto" };

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default function EditarProdutoPage({
  params,
  searchParams,
}: PageProps<"/admin/produtos/[id]">) {
  return (
    <AdminPage roles={["owner", "admin"]}>
      <EditProduct params={params} searchParams={searchParams} />
    </AdminPage>
  );
}

async function EditProduct({
  params,
  searchParams,
}: Pick<PageProps<"/admin/produtos/[id]">, "params" | "searchParams">) {
  const [{ id }, { salvo }] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();

  const [found, categories, options] = await Promise.all([
    getProduct(id),
    listCategories(),
    getProductFormOptions(),
  ]);
  if (!found) notFound();
  const { product, sheet } = found;

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <Link href="/admin/produtos" className="text-ink-600 text-sm underline">
        ← Produtos
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl">{product.name}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={product.status === "active" ? "ok" : "neutral"}>
            {PRODUCT_STATUS_LABEL[product.status]}
          </Badge>
          {product.status === "active" && (
            <Link
              href={`/produto/${product.slug}`}
              className="text-ink-600 text-sm underline"
            >
              Ver na loja
            </Link>
          )}
        </div>
      </header>

      {salvo === "1" && (
        <p role="status" className="bg-sand-200 rounded-(--radius-control) p-3">
          Produto criado. Complete a ficha técnica quando tiver os dados.
        </p>
      )}

      <div
        className={`flex flex-col gap-2 rounded-(--radius-media) border p-4 ${
          product.allergens_validated_at
            ? "border-leaf-700"
            : "border-warning-600"
        }`}
      >
        <p className="font-medium">
          {product.allergens_validated_at
            ? `Ficha de alergênicos validada em ${dateTime.format(new Date(product.allergens_validated_at))}.`
            : "Ficha de alergênicos não validada."}
        </p>
        <p className="text-ink-600 text-sm">
          Valide só depois de conferir ingredientes, “contém” e “pode conter”
          com a ficha técnica. Sem validação, a loja não mostra rótulos como
          “vegano” ou “sem glúten”.
        </p>
        <div>
          <ActionButton
            action={validateProductAllergens.bind(null, product.id)}
            label={
              product.allergens_validated_at
                ? "Validar de novo"
                : "Validar ficha de alergênicos"
            }
            pendingLabel="Validando…"
            variant="secondary"
            confirm="Confirma que a ficha salva confere com a ficha técnica do produto?"
          />
        </div>
      </div>

      <ProductForm
        key={product.id}
        product={product}
        sheet={sheet}
        categories={flattenTree(categories)}
        options={options}
        canManage
      />
    </section>
  );
}
