/**
 * Tipos e rótulos do catálogo. Os valores espelham os enums do banco
 * (migrations 0002 e 0006): se um enum mudar lá, muda aqui também.
 */

export const SALE_UNITS = [
  "un",
  "kg",
  "g",
  "maco",
  "pote",
  "porcao",
  "pacote",
  "duzia",
  "cacho",
  "bandeja",
  "litro",
  "kit",
  "combo",
] as const;
export type SaleUnit = (typeof SALE_UNITS)[number];

export const SALE_UNIT_LABEL: Record<SaleUnit, string> = {
  un: "Unidade",
  kg: "Quilo",
  g: "Gramas",
  maco: "Maço",
  pote: "Pote",
  porcao: "Porção",
  pacote: "Pacote",
  duzia: "Dúzia",
  cacho: "Cacho",
  bandeja: "Bandeja",
  litro: "Litro",
  kit: "Kit",
  combo: "Combo",
};

export const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  draft: "Rascunho",
  active: "À venda",
  archived: "Arquivado",
};

export const STOCK_MODES = ["tracked", "made_to_order", "untracked"] as const;
export type StockMode = (typeof STOCK_MODES)[number];

export const STOCK_MODE_LABEL: Record<StockMode, string> = {
  tracked: "Controla estoque",
  made_to_order: "Feito sob encomenda",
  untracked: "Sem controle de estoque",
};

export const STORAGE_KINDS = ["ambiente", "refrigerado", "congelado"] as const;
export type StorageKind = (typeof STORAGE_KINDS)[number];

export const STORAGE_LABEL: Record<StorageKind, string> = {
  ambiente: "Temperatura ambiente",
  refrigerado: "Refrigerado",
  congelado: "Congelado",
};

export const BUSINESS_UNITS = [
  "horta",
  "cozinha",
  "produtos",
  "parceiros",
] as const;
export type BusinessUnit = (typeof BUSINESS_UNITS)[number];

export const BUSINESS_UNIT_LABEL: Record<BusinessUnit, string> = {
  horta: "Horta",
  cozinha: "Cozinha",
  produtos: "Produtos",
  parceiros: "Parceiros",
};

export const CATEGORY_KINDS = ["loja", "encomendas"] as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export const CATEGORY_KIND_LABEL: Record<CategoryKind, string> = {
  loja: "Loja (carrinho)",
  encomendas: "Encomendas (orçamento)",
};

export const MONTH_LABEL = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

export type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  kind: CategoryKind;
  business_unit: BusinessUnit;
  description: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
};

export type ProductListItem = {
  id: string;
  slug: string;
  name: string;
  status: ProductStatus;
  category_id: string | null;
  sale_unit: SaleUnit;
  unit_size: number | null;
  price_cents: number | null;
  quote_only: boolean;
  allergens_validated_at: string | null;
  updated_at: string;
};

export type Product = ProductListItem & {
  short_description: string | null;
  description: string | null;
  stock_mode: StockMode;
  storage: StorageKind;
  shelf_life_days: number | null;
  conservation_info: string | null;
  yield_info: string | null;
  portions: number | null;
  seasonal_months: number[] | null;
  origin: string | null;
};

export type ProductSheet = {
  ingredientIds: string[];
  /** "Contém" calculado a partir dos ingredientes (só leitura). */
  containsFromIngredients: string[];
  containsManualIds: string[];
  mayContainIds: string[];
  dietLabels: { label_id: string; evidence: string | null }[];
  campaignIds: string[];
};

export type Option = { id: string; name: string };
export type Allergen = Option & { code: string; filter_group: string };
export type DietLabel = Option & { code: string; requires_evidence: boolean };

/** Estado devolvido pelas Server Actions dos formulários do painel. */
export type FormState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<string, string[]>>;
    };

export const IDLE: FormState = { status: "idle" };

export type Ingredient = {
  id: string;
  name: string;
  is_derived_from: string | null;
  allergen_ids: string[];
  product_count: number;
};

export type Campaign = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  starts_on: string | null;
  ends_on: string | null;
  order_deadline: string | null;
  is_active: boolean;
  sort_order: number;
  product_count: number;
};
