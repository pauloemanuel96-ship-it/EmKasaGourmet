import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { SEED_SECTIONS, demoCatalog } from "@/demo/store-catalog";
import { publicEnv } from "@/lib/env";
import {
  buildSections,
  toStoreProduct,
  type CatalogRow,
  type CategoryRow,
} from "./store-mapping";
import type { StoreCatalog } from "./store-types";

/**
 * Leitura pública da loja (D-031). Usa a chave pública, sem cookies, e passa
 * por `use cache` com a tag "catalogo": o painel chama updateTag("catalogo")
 * a cada alteração e a loja se atualiza na hora.
 */

export async function getStoreCatalog(): Promise<StoreCatalog> {
  "use cache";
  cacheTag("catalogo");
  cacheLife("minutes");

  let env: ReturnType<typeof publicEnv>;
  try {
    env = publicEnv();
  } catch {
    return demoCatalog(SEED_SECTIONS);
  }

  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const [categories, catalog, whatsapp] = await Promise.all([
    supabase
      .from("v_store_categories")
      .select(
        "id, slug, name, description, parent_id, root_slug, kind, is_featured, depth, sort_path",
      ),
    supabase.from("v_store_catalog").select("*"),
    supabase
      .from("settings")
      .select("value")
      .eq("key", "whatsapp_number")
      .maybeSingle(),
  ]);

  if (categories.error || catalog.error) {
    // Sem banco, a loja não quebra: mostra a demonstração, marcada como tal.
    console.error(
      "[loja] catálogo indisponível:",
      categories.error?.message ?? catalog.error?.message,
    );
    // Falha passageira: guarda a demonstração por poucos segundos só.
    cacheLife("seconds");
    return demoCatalog(SEED_SECTIONS);
  }

  const sections = buildSections((categories.data ?? []) as CategoryRow[]);
  const rows = (catalog.data ?? []) as CatalogRow[];
  const value = (whatsapp.data as { value: unknown } | null)?.value;
  const number = typeof value === "string" && value !== "" ? value : null;

  if (rows.length === 0) {
    return { ...demoCatalog(sections), whatsapp: number };
  }

  const products = rows
    .map((r) => toStoreProduct(r, env.NEXT_PUBLIC_SUPABASE_URL))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return { source: "banco", products, sections, whatsapp: number };
}

export async function getStoreProduct(slug: string) {
  const catalog = await getStoreCatalog();
  return {
    catalog,
    product: catalog.products.find((p) => p.slug === slug) ?? null,
  };
}
