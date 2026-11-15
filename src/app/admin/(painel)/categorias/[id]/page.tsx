import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { CategoryForm } from "@/components/admin/catalogo/category-form";
import { AdminPage } from "@/components/admin/page-shell";
import { getCategory, listCategories } from "@/modules/catalogo/admin-queries";
import { descendantIds, flattenTree } from "@/modules/catalogo/tree";

export const metadata: Metadata = { title: "Editar categoria" };

export default function EditarCategoriaPage({
  params,
  searchParams,
}: PageProps<"/admin/categorias/[id]">) {
  return (
    <AdminPage roles={["owner", "admin"]}>
      <EditCategory params={params} searchParams={searchParams} />
    </AdminPage>
  );
}

async function EditCategory({
  params,
  searchParams,
}: Pick<PageProps<"/admin/categorias/[id]">, "params" | "searchParams">) {
  const [{ id }, { salvo }] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();

  const [category, categories] = await Promise.all([
    getCategory(id),
    listCategories(),
  ]);
  if (!category) notFound();

  // Não pode ficar dentro dela mesma nem de uma descendente.
  const blocked = descendantIds(categories, id);
  const parents = flattenTree(categories).filter((c) => !blocked.has(c.id));

  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <Link href="/admin/categorias" className="text-ink-600 text-sm underline">
        ← Categorias
      </Link>
      <h1 className="text-3xl">{category.name}</h1>
      {salvo === "1" && (
        <p role="status" className="bg-sand-200 rounded-(--radius-control) p-3">
          Categoria criada.
        </p>
      )}
      <CategoryForm key={id} category={category} parents={parents} />
    </section>
  );
}
