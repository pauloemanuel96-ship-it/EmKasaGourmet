import type { Metadata } from "next";
import Link from "next/link";
import { IngredientForm } from "@/components/admin/catalogo/ingredient-form";
import { AdminPage } from "@/components/admin/page-shell";
import {
  listAllergens,
  listIngredients,
} from "@/modules/catalogo/admin-queries";

export const metadata: Metadata = { title: "Novo ingrediente" };

export default function NovoIngredientePage() {
  return (
    <AdminPage roles={["owner", "admin"]}>
      <NewIngredient />
    </AdminPage>
  );
}

async function NewIngredient() {
  const [ingredients, allergens] = await Promise.all([
    listIngredients(),
    listAllergens(),
  ]);
  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <Link
        href="/admin/ingredientes"
        className="text-ink-600 text-sm underline"
      >
        ← Ingredientes
      </Link>
      <h1 className="text-3xl">Novo ingrediente</h1>
      <IngredientForm allergens={allergens} bases={ingredients} />
    </section>
  );
}
