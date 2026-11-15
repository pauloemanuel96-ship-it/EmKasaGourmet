import type { Metadata } from "next";
import Link from "next/link";
import { Badge, buttonPrimary } from "@/components/admin/catalogo/fields";
import { AdminPage } from "@/components/admin/page-shell";
import {
  listAllergens,
  listIngredients,
} from "@/modules/catalogo/admin-queries";

export const metadata: Metadata = { title: "Ingredientes" };

export default function IngredientesPage({
  searchParams,
}: PageProps<"/admin/ingredientes">) {
  return (
    <AdminPage roles={["owner", "admin"]}>
      <IngredientList searchParams={searchParams} />
    </AdminPage>
  );
}

async function IngredientList({
  searchParams,
}: {
  searchParams: PageProps<"/admin/ingredientes">["searchParams"];
}) {
  const [{ salvo }, ingredients, allergens] = await Promise.all([
    searchParams,
    listIngredients(),
    listAllergens(),
  ]);
  const allergenName = new Map(allergens.map((a) => [a.id, a.name]));

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Ingredientes</h1>
          <p className="text-ink-600">
            Cada ingrediente guarda os seus alergênicos. A ficha dos produtos
            calcula o “contém” a partir daqui.
          </p>
        </div>
        <Link href="/admin/ingredientes/novo" className={buttonPrimary}>
          Novo ingrediente
        </Link>
      </header>

      {salvo === "1" && (
        <p role="status" className="bg-sand-200 rounded-(--radius-control) p-3">
          Ingrediente criado.
        </p>
      )}

      {ingredients.length === 0 ? (
        <p className="text-ink-600">Nenhum ingrediente cadastrado ainda.</p>
      ) : (
        <ul className="border-sand-200 bg-paper divide-sand-200 divide-y rounded-(--radius-media) border">
          {ingredients.map((i) => (
            <li key={i.id} className="flex flex-col gap-1.5 px-4 py-3">
              <Link
                href={`/admin/ingredientes/${i.id}`}
                className="font-medium underline-offset-2 hover:underline"
              >
                {i.name}
              </Link>
              <div className="flex flex-wrap items-center gap-1.5">
                {i.allergen_ids.length === 0 ? (
                  <Badge tone="muted">Sem alergênicos marcados</Badge>
                ) : (
                  i.allergen_ids.map((id) => (
                    <Badge key={id} tone="warn">
                      {allergenName.get(id) ?? "?"}
                    </Badge>
                  ))
                )}
                <span className="text-ink-600 text-xs">
                  Usado em {i.product_count} produto(s)
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
