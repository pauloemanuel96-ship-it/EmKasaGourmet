import "server-only";
import { createClient } from "@/lib/supabase/server";
import { descendantIds } from "./tree";
import type {
  Allergen,
  Campaign,
  Category,
  Ingredient,
  DietLabel,
  Option,
  Product,
  ProductListItem,
  ProductSheet,
  ProductStatus,
} from "./types";

/**
 * Leituras do painel. Usam a sessão de quem está logado (o RLS decide), por
 * isso não passam por `use cache`: a equipe vê rascunhos e itens inativos.
 */

const CATEGORY_COLUMNS =
  "id, name, slug, parent_id, kind, business_unit, description, is_featured, is_active, sort_order";

const PRODUCT_LIST_COLUMNS =
  "id, slug, name, status, category_id, sale_unit, unit_size, price_cents, quote_only, allergens_validated_at, updated_at";

const PRODUCT_COLUMNS = `${PRODUCT_LIST_COLUMNS}, short_description, description, stock_mode, storage, shelf_life_days, conservation_info, yield_info, portions, seasonal_months, origin`;

function fail(what: string, error: { message: string; code?: string }): never {
  console.error(`[catalogo] ${what}:`, error.code, error.message);
  throw new Error(`Não foi possível carregar ${what}.`);
}

export async function listCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .order("sort_order")
    .order("name");
  if (error) fail("as categorias", error);
  return (data ?? []) as Category[];
}

export async function getCategory(id: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) fail("a categoria", error);
  return (data as Category | null) ?? null;
}

/** Quantos produtos cada categoria tem (diretamente), por situação. */
export async function countProductsByCategory(): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("category_id")
    .neq("status", "archived");
  if (error) fail("a contagem de produtos", error);
  const counts = new Map<string, number>();
  for (const row of (data ?? []) as { category_id: string | null }[]) {
    if (!row.category_id) continue;
    counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
  }
  return counts;
}

export type ProductFilters = {
  status?: ProductStatus;
  categoryId?: string;
  query?: string;
};

export async function listProducts(
  filters: ProductFilters,
  categories: Category[],
): Promise<ProductListItem[]> {
  const supabase = await createClient();
  let q = supabase
    .from("products")
    .select(PRODUCT_LIST_COLUMNS)
    .order("name")
    .limit(500);
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.categoryId) {
    q = q.in("category_id", [...descendantIds(categories, filters.categoryId)]);
  }
  if (filters.query) {
    // Escapa os curingas do LIKE para a busca ser literal.
    const term = filters.query.replace(/[\\%_]/g, (m) => `\\${m}`);
    q = q.ilike("name", `%${term}%`);
  }
  const { data, error } = await q;
  if (error) fail("os produtos", error);
  return (data ?? []) as ProductListItem[];
}

export async function getProduct(
  id: string,
): Promise<{ product: Product; sheet: ProductSheet } | null> {
  const supabase = await createClient();
  const [product, ingredients, allergens, labels, campaigns] =
    await Promise.all([
      supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("product_ingredients")
        .select("ingredient_id, position")
        .eq("product_id", id)
        .order("position"),
      supabase
        .from("product_allergens")
        .select("allergen_id, presence, source")
        .eq("product_id", id),
      supabase
        .from("product_diet_labels")
        .select("label_id, evidence")
        .eq("product_id", id),
      supabase
        .from("product_campaigns")
        .select("campaign_id")
        .eq("product_id", id),
    ]);

  for (const [what, res] of [
    ["o produto", product],
    ["os ingredientes do produto", ingredients],
    ["os alergênicos do produto", allergens],
    ["os rótulos do produto", labels],
    ["as campanhas do produto", campaigns],
  ] as const) {
    if (res.error) fail(what, res.error);
  }
  if (!product.data) return null;

  type AllergenRow = { allergen_id: string; presence: string; source: string };
  const allergenRows = (allergens.data ?? []) as AllergenRow[];
  const pick = (presence: string, source: string) => [
    ...new Set(
      allergenRows
        .filter((r) => r.presence === presence && r.source === source)
        .map((r) => r.allergen_id),
    ),
  ];

  return {
    product: product.data as Product,
    sheet: {
      ingredientIds: (
        (ingredients.data ?? []) as { ingredient_id: string }[]
      ).map((r) => r.ingredient_id),
      containsFromIngredients: pick("contains", "ingredient"),
      containsManualIds: pick("contains", "manual"),
      mayContainIds: pick("may_contain", "cross_contamination"),
      dietLabels: (labels.data ?? []) as ProductSheet["dietLabels"],
      campaignIds: ((campaigns.data ?? []) as { campaign_id: string }[]).map(
        (r) => r.campaign_id,
      ),
    },
  };
}

/** Listas de apoio do formulário de produto. */
export async function getProductFormOptions(): Promise<{
  ingredients: Option[];
  allergens: Allergen[];
  dietLabels: DietLabel[];
  campaigns: (Option & { is_active: boolean })[];
}> {
  const supabase = await createClient();
  const [ingredients, allergens, dietLabels, campaigns] = await Promise.all([
    supabase.from("ingredients").select("id, name").order("name"),
    supabase
      .from("allergens")
      .select("id, code, name, filter_group")
      .order("name"),
    supabase
      .from("diet_labels")
      .select("id, code, name, requires_evidence")
      .order("name"),
    supabase
      .from("campaigns")
      .select("id, name, is_active")
      .order("sort_order")
      .order("name"),
  ]);
  for (const [what, res] of [
    ["os ingredientes", ingredients],
    ["os alergênicos", allergens],
    ["os rótulos", dietLabels],
    ["as campanhas", campaigns],
  ] as const) {
    if (res.error) fail(what, res.error);
  }
  return {
    ingredients: (ingredients.data ?? []) as Option[],
    allergens: (allergens.data ?? []) as Allergen[],
    dietLabels: (dietLabels.data ?? []) as DietLabel[],
    campaigns: (campaigns.data ?? []) as (Option & { is_active: boolean })[],
  };
}

export async function listIngredients(): Promise<Ingredient[]> {
  const supabase = await createClient();
  const [ingredients, links, uses] = await Promise.all([
    supabase
      .from("ingredients")
      .select("id, name, is_derived_from")
      .order("name"),
    supabase.from("ingredient_allergens").select("ingredient_id, allergen_id"),
    supabase.from("product_ingredients").select("ingredient_id"),
  ]);
  for (const [what, res] of [
    ["os ingredientes", ingredients],
    ["os alergênicos dos ingredientes", links],
    ["o uso dos ingredientes", uses],
  ] as const) {
    if (res.error) fail(what, res.error);
  }
  const allergens = new Map<string, string[]>();
  for (const r of (links.data ?? []) as {
    ingredient_id: string;
    allergen_id: string;
  }[]) {
    allergens.set(r.ingredient_id, [
      ...(allergens.get(r.ingredient_id) ?? []),
      r.allergen_id,
    ]);
  }
  const count = new Map<string, number>();
  for (const r of (uses.data ?? []) as { ingredient_id: string }[]) {
    count.set(r.ingredient_id, (count.get(r.ingredient_id) ?? 0) + 1);
  }
  return (
    (ingredients.data ?? []) as Omit<
      Ingredient,
      "allergen_ids" | "product_count"
    >[]
  ).map((i) => ({
    ...i,
    allergen_ids: allergens.get(i.id) ?? [],
    product_count: count.get(i.id) ?? 0,
  }));
}

export async function listAllergens(): Promise<Allergen[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("allergens")
    .select("id, code, name, filter_group")
    .order("name");
  if (error) fail("os alergênicos", error);
  return (data ?? []) as Allergen[];
}

export async function listCampaigns(): Promise<Campaign[]> {
  const supabase = await createClient();
  const [campaigns, links] = await Promise.all([
    supabase
      .from("campaigns")
      .select(
        "id, slug, name, description, starts_on, ends_on, order_deadline, is_active, sort_order",
      )
      .order("sort_order")
      .order("name"),
    supabase.from("product_campaigns").select("campaign_id"),
  ]);
  if (campaigns.error) fail("as campanhas", campaigns.error);
  if (links.error) fail("os produtos das campanhas", links.error);
  const count = new Map<string, number>();
  for (const r of (links.data ?? []) as { campaign_id: string }[]) {
    count.set(r.campaign_id, (count.get(r.campaign_id) ?? 0) + 1);
  }
  return ((campaigns.data ?? []) as Omit<Campaign, "product_count">[]).map(
    (c) => ({
      ...c,
      product_count: count.get(c.id) ?? 0,
    }),
  );
}

/** Número de WhatsApp de atendimento (E.164) ou null se não definido. */
export async function getWhatsappSetting(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "whatsapp_number")
    .maybeSingle();
  if (error) fail("as configurações", error);
  const value = (data as { value: unknown } | null)?.value;
  return typeof value === "string" && value !== "" ? value : null;
}
