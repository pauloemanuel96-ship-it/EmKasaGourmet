import type { Metadata } from "next";
import Link from "next/link";
import { CategoryForm } from "@/components/admin/catalogo/category-form";
import { AdminPage } from "@/components/admin/page-shell";
import { listCategories } from "@/modules/catalogo/admin-queries";
import { flattenTree } from "@/modules/catalogo/tree";

export const metadata: Metadata = { title: "Nova categoria" };

export default function NovaCategoriaPage({
  searchParams,
}: PageProps<"/admin/categorias/nova">) {
  return (
    <AdminPage roles={["owner", "admin"]}>
      <NewCategory searchParams={searchParams} />
    </AdminPage>
  );
}

async function NewCategory({
  searchParams,
}: {
  searchParams: PageProps<"/admin/categorias/nova">["searchParams"];
}) {
  const [{ mae }, categories] = await Promise.all([
    searchParams,
    listCategories(),
  ]);
  const parents = flattenTree(categories);
  const parentId =
    typeof mae === "string" && parents.some((p) => p.id === mae)
      ? mae
      : undefined;

  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <Link href="/admin/categorias" className="text-ink-600 text-sm underline">
        ← Categorias
      </Link>
      <h1 className="text-3xl">Nova categoria</h1>
      <CategoryForm parents={parents} defaultParentId={parentId} />
    </section>
  );
}
