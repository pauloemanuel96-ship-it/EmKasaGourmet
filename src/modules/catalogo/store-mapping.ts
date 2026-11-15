/** Converte as linhas das views públicas no formato da loja. Sem servidor: testável. */
import { STATIC_COVERS, STATIC_GALLERY } from "./static-photos";
import type { StoreAllergen, StoreProduct, StoreSection } from "./store-types";
import { SALE_UNIT_LABEL, type SaleUnit, type StorageKind } from "./types";

const PHOTO_BUCKET = "produtos";

export type CategoryRow = {
  slug: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  id: string;
  root_slug: string;
  kind: "loja" | "encomendas";
  is_featured: boolean;
  depth: number;
  sort_path: number[];
};

export type CatalogRow = {
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  sale_unit: SaleUnit;
  unit_size: number | string | null;
  price_cents: number | null;
  quote_only: boolean;
  storage: StorageKind;
  conservation_info: string | null;
  origin: string | null;
  stock_mode: "tracked" | "made_to_order" | "untracked";
  portions: number | null;
  yield_info: string | null;
  in_season: boolean;
  category_slug: string;
  category_name: string;
  root_slug: string;
  root_name: string;
  channel: "loja" | "encomendas";
  path_names: string[];
  sort_path: number[];
  allergens_validated: boolean;
  is_available: boolean;
  ingredients: string[];
  contains: StoreAllergen[];
  may_contain: StoreAllergen[];
  blocked_groups: string[];
  diet_labels: StoreAllergen[];
  campaigns: string[];
  cover: { path: string; alt: string } | null;
};

/** Tons da paleta para a ilustração, escolhidos pelo slug (estável). */
const TONES = [
  "#4f7343",
  "#6f8f4e",
  "#a4462f",
  "#b9873f",
  "#7a6a4f",
  "#3f5f4a",
];
function toneOf(slug: string) {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

/** Unidades cujo "tamanho" é o peso em gramas (dica do formulário do painel). */
const GRAM_UNITS: SaleUnit[] = ["g", "pote", "pacote", "porcao", "bandeja"];

/** "Pote 500 g", "1,5 kg", "Maço"... */
export function unitLabelOf(unit: SaleUnit, size: number | string | null) {
  const label = SALE_UNIT_LABEL[unit];
  if (size === null || size === undefined || size === "") return label;
  const n = Number(size);
  if (!Number.isFinite(n) || n <= 0) return label;
  const pretty = String(n).replace(".", ",");
  if (unit === "kg") return `${pretty} kg`;
  if (unit === "litro") return `${pretty} L`;
  if (unit === "g") return `${pretty} g`;
  if (GRAM_UNITS.includes(unit)) return `${label} ${pretty} g`;
  return label;
}

export function buildSections(rows: CategoryRow[]): StoreSection[] {
  const bySort = (a: CategoryRow, b: CategoryRow) =>
    a.sort_path
      .join(".")
      .localeCompare(b.sort_path.join("."), undefined, { numeric: true });
  const roots = rows.filter((r) => r.depth === 0).sort(bySort);
  return roots.map((r) => ({
    slug: r.slug,
    name: r.name,
    description: r.description,
    featured: r.is_featured,
    channel: r.kind,
    children: rows
      .filter((c) => c.depth > 0 && c.root_slug === r.slug)
      .sort(bySort)
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        description: c.description,
        featured: c.is_featured,
      })),
  }));
}

export function toStoreProduct(
  row: CatalogRow,
  supabaseUrl: string,
): StoreProduct {
  return {
    slug: row.slug,
    name: row.name,
    short: row.short_description,
    description: row.description,
    sectionSlug: row.root_slug,
    sectionName: row.root_name,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    path: row.path_names,
    channel: row.channel,
    saleUnit: row.sale_unit,
    unitLabel: unitLabelOf(row.sale_unit, row.unit_size),
    priceCents: row.price_cents,
    quoteOnly: row.quote_only,
    storage: row.storage,
    conservation: row.conservation_info,
    origin: row.origin,
    yieldInfo: row.yield_info,
    portions: row.portions,
    ingredients: row.ingredients ?? [],
    contains: row.contains ?? [],
    mayContain: row.may_contain ?? [],
    blockedGroups: row.blocked_groups ?? [],
    allergensValidated: row.allergens_validated,
    diet: row.diet_labels ?? [],
    campaigns: row.campaigns ?? [],
    madeToOrder: row.stock_mode === "made_to_order",
    available: row.is_available,
    inSeason: row.in_season,
    cover: row.cover
      ? {
          url: `${supabaseUrl}/storage/v1/object/public/${PHOTO_BUCKET}/${row.cover.path}`,
          alt: row.cover.alt,
        }
      : (STATIC_COVERS[row.slug] ?? null),
    gallery: STATIC_GALLERY[row.slug] ?? [],
    tone: toneOf(row.slug),
    isDemo: false,
    comingSoon: false,
  };
}

export type MediaRow = {
  product_slug: string;
  path: string;
  alt: string;
  is_cover: boolean;
  sort_order: number;
};

/** Fotos que não são a principal, por produto, já em ordem. */
export function galleryBySlug(rows: MediaRow[], supabaseUrl: string) {
  const out = new Map<string, { url: string; alt: string }[]>();
  for (const r of rows) {
    if (r.is_cover) continue;
    const list = out.get(r.product_slug) ?? [];
    list.push({
      url: `${supabaseUrl}/storage/v1/object/public/${PHOTO_BUCKET}/${r.path}`,
      alt: r.alt,
    });
    out.set(r.product_slug, list);
  }
  return out;
}
