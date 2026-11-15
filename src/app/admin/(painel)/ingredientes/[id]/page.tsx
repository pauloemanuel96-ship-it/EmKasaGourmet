import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { IngredientForm } from "@/components/admin/catalogo/ingredient-form";
import { AdminPage } from "@/components/admin/page-shell";
import {
  listAllergens,
  listIngredients,
} from "@/modules/catalogo/admin-queries";

export const metadata: Metadata = { title: "Editar ingrediente" };

export default function EditarIngredientePage({
  params,
}: PageProps<"/admin/ingredientes/[id]">) {
  return (
    <AdminPage roles={["owner", "admin"]}>
      <EditIngredient params={params} />
    </AdminPage>
  );
}

async function EditIngredient({
  params,
}: Pick<PageProps<"/admin/ingredientes/[id]">, "params">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [ingredients, allergens] = await Promise.all([
    listIngredients(),
    listAllergens(),
  ]);
  const ingredient = ingredients.find((i) => i.id === id);
  if (!ingredient) notFound();

  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <Link
        href="/admin/ingredientes"
        className="text-ink-600 text-sm underline"
      >
        ← Ingredientes
      </Link>
      <h1 className="text-3xl">{ingredient.name}</h1>
      {ingredient.product_count > 0 && (
        <p className="bg-sand-200 rounded-(--radius-control) p-3 text-sm">
          Usado em {ingredient.product_count} produto(s). Mudar os alergênicos
          vai pedir nova validação da ficha desses produtos.
        </p>
      )}
      <IngredientForm
        key={id}
        ingredient={ingredient}
        allergens={allergens}
        bases={ingredients.filter((i) => i.id !== id)}
      />
    </section>
  );
}
