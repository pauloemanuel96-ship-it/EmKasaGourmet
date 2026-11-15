import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/admin/catalogo/product-form";
import { AdminPage } from "@/components/admin/page-shell";
import { getCurrentUser } from "@/modules/auth/staff";
import {
  getProductFormOptions,
  listCategories,
} from "@/modules/catalogo/admin-queries";
import { flattenTree } from "@/modules/catalogo/tree";

export const metadata: Metadata = { title: "Novo produto" };

export default function NovoProdutoPage() {
  return (
    <AdminPage roles={["owner", "admin", "operacao"]}>
      <NewProduct />
    </AdminPage>
  );
}

async function NewProduct() {
  const [user, categories, options] = await Promise.all([
    getCurrentUser(),
    listCategories(),
    getProductFormOptions(),
  ]);
  const canManage = user?.role === "owner" || user?.role === "admin";

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <Link href="/admin/produtos" className="text-ink-600 text-sm underline">
        ← Produtos
      </Link>
      <h1 className="text-3xl">
        {canManage ? "Novo produto" : "Novo rascunho"}
      </h1>
      <ProductForm
        categories={flattenTree(categories)}
        options={options}
        canManage={canManage}
      />
    </section>
  );
}
