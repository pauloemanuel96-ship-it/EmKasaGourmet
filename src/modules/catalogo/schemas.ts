import { z } from "zod";
import { parseBRLToCents } from "@/lib/money";
import {
  BUSINESS_UNITS,
  CATEGORY_KINDS,
  PRODUCT_STATUSES,
  SALE_UNITS,
  STOCK_MODES,
  STORAGE_KINDS,
} from "./types";

/**
 * Validação dos formulários do painel (CLAUDE.md, regra 5).
 * O banco valida de novo nas funções admin_save_* (D-029): aqui o objetivo é
 * devolver mensagens claras por campo e montar o JSON que a função espera.
 */

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const optionalText = (max: number) =>
  z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(max, { error: `Use no máximo ${max} caracteres.` })
      .optional(),
  );

const optionalUuid = z.preprocess(emptyToUndefined, z.uuid().optional());

const checkbox = z.preprocess((v) => v === "on" || v === "true", z.boolean());

const optionalPositiveInt = (label: string) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: `${label}: use só números.` })
      .int({ error: `${label}: use um número inteiro.` })
      .positive({ error: `${label}: precisa ser maior que zero.` })
      .max(100_000, { error: `${label}: valor muito alto.` })
      .optional(),
  );

const uuidList = z.array(z.uuid()).default([]);

// -----------------------------------------------------------------------------
// Categoria
// -----------------------------------------------------------------------------

export const categorySchema = z.object({
  id: optionalUuid,
  name: z
    .string({ error: "Informe o nome da categoria." })
    .trim()
    .min(1, { error: "Informe o nome da categoria." })
    .max(80, { error: "Use no máximo 80 caracteres." }),
  parent_id: optionalUuid,
  kind: z.enum(CATEGORY_KINDS).default("loja"),
  business_unit: z.enum(BUSINESS_UNITS).default("cozinha"),
  description: optionalText(500),
  is_featured: checkbox,
  is_active: checkbox,
  sort_order: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: "Ordem: use só números." })
      .int({ error: "Ordem: use um número inteiro." })
      .min(0, { error: "Ordem: use zero ou mais." })
      .max(100_000)
      .optional(),
  ),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export function readCategoryForm(fd: FormData) {
  return {
    id: fd.get("id") ?? undefined,
    name: fd.get("name") ?? undefined,
    parent_id: fd.get("parent_id") ?? undefined,
    kind: fd.get("kind") || undefined,
    business_unit: fd.get("business_unit") || undefined,
    description: fd.get("description") ?? undefined,
    is_featured: fd.get("is_featured"),
    is_active: fd.get("is_active"),
    sort_order: fd.get("sort_order") ?? undefined,
  };
}

/** JSON para public.admin_save_category. */
export function toCategoryPayload(c: CategoryInput) {
  return {
    id: c.id ?? null,
    name: c.name,
    parent_id: c.parent_id ?? null,
    kind: c.kind,
    business_unit: c.business_unit,
    description: c.description ?? null,
    is_featured: c.is_featured,
    is_active: c.is_active,
    sort_order: c.sort_order ?? null,
  };
}

// -----------------------------------------------------------------------------
// Produto
// -----------------------------------------------------------------------------

const price = z.preprocess(
  (v) => (typeof v === "string" ? parseBRLToCents(v) : v),
  z
    .number({ error: "Preço: use o formato 12,50." })
    .int()
    .min(0, { error: "O preço não pode ser negativo." })
    .nullable(),
);

const unitSize = z.preprocess(
  (v) => {
    if (typeof v !== "string") return v;
    const s = v.trim().replace(",", ".");
    return s === "" ? undefined : s;
  },
  z
    .string()
    .regex(/^\d{1,9}(\.\d{1,3})?$/, {
      error: "Tamanho: use números, com até 3 casas (ex.: 0,5).",
    })
    .refine((s) => Number(s) > 0, {
      error: "Tamanho: precisa ser maior que zero.",
    })
    .optional(),
);

export const productSchema = z
  .object({
    id: optionalUuid,
    name: z
      .string({ error: "Informe o nome do produto." })
      .trim()
      .min(1, { error: "Informe o nome do produto." })
      .max(120, { error: "Use no máximo 120 caracteres." }),
    category_id: z.uuid({ error: "Escolha uma categoria." }),
    short_description: optionalText(200),
    description: optionalText(4000),
    sale_unit: z.enum(SALE_UNITS, { error: "Escolha a unidade de venda." }),
    unit_size: unitSize,
    price_cents: price,
    quote_only: checkbox,
    status: z.enum(PRODUCT_STATUSES).default("draft"),
    stock_mode: z.enum(STOCK_MODES).default("tracked"),
    storage: z.enum(STORAGE_KINDS).default("ambiente"),
    shelf_life_days: optionalPositiveInt("Validade"),
    portions: optionalPositiveInt("Porções"),
    conservation_info: optionalText(1000),
    yield_info: optionalText(300),
    origin: optionalText(200),
    seasonal_months: z
      .array(z.coerce.number().int().min(1).max(12))
      .default([]),
    /** Só presente quando o formulário traz a ficha técnica (administração). */
    sheet: z
      .object({
        ingredient_ids: uuidList,
        contains_manual_ids: uuidList,
        may_contain_ids: uuidList,
        diet_labels: z
          .array(
            z.object({
              label_id: z.uuid(),
              evidence: optionalText(500),
            }),
          )
          .default([]),
        campaign_ids: uuidList,
      })
      .optional(),
  })
  .superRefine((p, ctx) => {
    if (p.status === "active" && p.price_cents === null && !p.quote_only) {
      ctx.addIssue({
        code: "custom",
        path: ["price_cents"],
        message: 'Para pôr à venda, informe o preço ou marque "sob orçamento".',
      });
    }
  });
export type ProductInput = z.infer<typeof productSchema>;

export function readProductForm(fd: FormData) {
  const hasSheet = fd.get("sheet") === "1";
  const labelIds = fd.getAll("label_ids").map(String);
  return {
    id: fd.get("id") ?? undefined,
    name: fd.get("name") ?? undefined,
    category_id: fd.get("category_id") ?? undefined,
    short_description: fd.get("short_description") ?? undefined,
    description: fd.get("description") ?? undefined,
    sale_unit: fd.get("sale_unit") || undefined,
    unit_size: fd.get("unit_size") ?? undefined,
    price_cents: fd.get("price") ?? "",
    quote_only: fd.get("quote_only"),
    status: fd.get("status") || undefined,
    stock_mode: fd.get("stock_mode") || undefined,
    storage: fd.get("storage") || undefined,
    shelf_life_days: fd.get("shelf_life_days") ?? undefined,
    portions: fd.get("portions") ?? undefined,
    conservation_info: fd.get("conservation_info") ?? undefined,
    yield_info: fd.get("yield_info") ?? undefined,
    origin: fd.get("origin") ?? undefined,
    seasonal_months: fd.getAll("seasonal_months").map(String),
    sheet: hasSheet
      ? {
          ingredient_ids: fd.getAll("ingredient_ids").map(String),
          contains_manual_ids: fd.getAll("contains_manual_ids").map(String),
          may_contain_ids: fd.getAll("may_contain_ids").map(String),
          diet_labels: labelIds.map((label_id) => ({
            label_id,
            evidence: fd.get(`evidence_${label_id}`) ?? undefined,
          })),
          campaign_ids: fd.getAll("campaign_ids").map(String),
        }
      : undefined,
  };
}

/**
 * JSON para public.admin_save_product. Sem `sheet`, as chaves da ficha ficam
 * de fora e o banco mantém o que já estava (é o caso da operação).
 */
export function toProductPayload(p: ProductInput) {
  const base = {
    id: p.id ?? null,
    name: p.name,
    category_id: p.category_id,
    short_description: p.short_description ?? null,
    description: p.description ?? null,
    sale_unit: p.sale_unit,
    unit_size: p.unit_size ?? null,
    price_cents: p.price_cents,
    quote_only: p.quote_only,
    status: p.status,
    stock_mode: p.stock_mode,
    storage: p.storage,
    shelf_life_days: p.shelf_life_days ?? null,
    portions: p.portions ?? null,
    conservation_info: p.conservation_info ?? null,
    yield_info: p.yield_info ?? null,
    origin: p.origin ?? null,
    seasonal_months: [...new Set(p.seasonal_months)].sort((a, b) => a - b),
  };
  if (!p.sheet) return base;
  return {
    ...base,
    ingredient_ids: [...new Set(p.sheet.ingredient_ids)],
    contains_manual_ids: [...new Set(p.sheet.contains_manual_ids)],
    may_contain_ids: [...new Set(p.sheet.may_contain_ids)],
    diet_labels: p.sheet.diet_labels.map((l) => ({
      label_id: l.label_id,
      evidence: l.evidence ?? null,
    })),
    campaign_ids: [...new Set(p.sheet.campaign_ids)],
  };
}

export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

// -----------------------------------------------------------------------------
// Ingrediente
// -----------------------------------------------------------------------------

export const ingredientSchema = z.object({
  id: optionalUuid,
  name: z
    .string({ error: "Informe o nome do ingrediente." })
    .trim()
    .min(1, { error: "Informe o nome do ingrediente." })
    .max(120, { error: "Use no máximo 120 caracteres." }),
  is_derived_from: optionalUuid,
  allergen_ids: uuidList,
});
export type IngredientInput = z.infer<typeof ingredientSchema>;

export function readIngredientForm(fd: FormData) {
  return {
    id: fd.get("id") ?? undefined,
    name: fd.get("name") ?? undefined,
    is_derived_from: fd.get("is_derived_from") ?? undefined,
    allergen_ids: fd.getAll("allergen_ids").map(String),
  };
}

/** JSON para public.admin_save_ingredient. */
export function toIngredientPayload(i: IngredientInput) {
  return {
    id: i.id ?? null,
    name: i.name,
    is_derived_from: i.is_derived_from ?? null,
    allergen_ids: [...new Set(i.allergen_ids)],
  };
}

// -----------------------------------------------------------------------------
// Campanha
// -----------------------------------------------------------------------------

const optionalDate = z.preprocess(
  emptyToUndefined,
  z.iso.date({ error: "Use uma data válida." }).optional(),
);

export const campaignSchema = z
  .object({
    id: optionalUuid,
    name: z
      .string({ error: "Informe o nome da campanha." })
      .trim()
      .min(1, { error: "Informe o nome da campanha." })
      .max(80, { error: "Use no máximo 80 caracteres." }),
    description: optionalText(1000),
    starts_on: optionalDate,
    ends_on: optionalDate,
    order_deadline: optionalDate,
    is_active: checkbox,
    sort_order: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number({ error: "Ordem: use só números." })
        .int()
        .min(0)
        .max(100_000)
        .optional(),
    ),
  })
  .superRefine((c, ctx) => {
    if (c.starts_on && c.ends_on && c.ends_on < c.starts_on) {
      ctx.addIssue({
        code: "custom",
        path: ["ends_on"],
        message: "O fim não pode ser antes do início.",
      });
    }
    if (c.order_deadline && c.ends_on && c.order_deadline > c.ends_on) {
      ctx.addIssue({
        code: "custom",
        path: ["order_deadline"],
        message: "O prazo de pedido não pode passar do fim da campanha.",
      });
    }
  });
export type CampaignInput = z.infer<typeof campaignSchema>;

export function readCampaignForm(fd: FormData) {
  return {
    id: fd.get("id") ?? undefined,
    name: fd.get("name") ?? undefined,
    description: fd.get("description") ?? undefined,
    starts_on: fd.get("starts_on") ?? undefined,
    ends_on: fd.get("ends_on") ?? undefined,
    order_deadline: fd.get("order_deadline") ?? undefined,
    is_active: fd.get("is_active"),
    sort_order: fd.get("sort_order") ?? undefined,
  };
}

/** JSON para public.admin_save_campaign. */
export function toCampaignPayload(c: CampaignInput) {
  return {
    id: c.id ?? null,
    name: c.name,
    description: c.description ?? null,
    starts_on: c.starts_on ?? null,
    ends_on: c.ends_on ?? null,
    order_deadline: c.order_deadline ?? null,
    is_active: c.is_active,
    sort_order: c.sort_order ?? null,
  };
}

// -----------------------------------------------------------------------------
// WhatsApp de atendimento (settings.whatsapp_number, formato E.164)
// -----------------------------------------------------------------------------

/**
 * Aceita "(79) 99999-9999", "79999999999" ou "+55 79 99999-9999".
 * Devolve "+5579999999999". Sem DDI, assume Brasil (+55).
 */
export function normalizeWhatsapp(input: string): string | null | undefined {
  const digits = input.replace(/\D/g, "");
  if (digits === "") return null;
  // Com "+" a pessoa já informou o DDI; sem ele, 10 ou 11 dígitos são DDD + número.
  const hasCountry = input.trim().startsWith("+");
  const full =
    !hasCountry && (digits.length === 10 || digits.length === 11)
      ? `55${digits}`
      : digits;
  if (!/^55\d{10,11}$/.test(full)) return undefined;
  return `+${full}`;
}

export const whatsappSchema = z.object({
  whatsapp: z.preprocess(
    (v) => (typeof v === "string" ? normalizeWhatsapp(v) : v),
    z.string({ error: "Use DDD + número, ex.: (79) 99999-9999." }).nullable(),
  ),
});
