/**
 * Forma única dos produtos na loja, venha do banco (v_store_catalog) ou da
 * demonstração. Sem dependência de servidor: pode ir para componentes cliente.
 */
import type { SaleUnit, StorageKind } from "./types";

export type StoreAllergen = { code: string; name: string };

export type StoreProduct = {
  slug: string;
  name: string;
  short: string | null;
  description: string | null;
  /** Seção = categoria de primeiro nível (ex.: "Horta e Naturais"). */
  sectionSlug: string;
  sectionName: string;
  categorySlug: string;
  categoryName: string;
  path: string[];
  channel: "loja" | "encomendas";
  saleUnit: SaleUnit;
  unitLabel: string;
  priceCents: number | null;
  quoteOnly: boolean;
  storage: StorageKind;
  conservation: string | null;
  origin: string | null;
  yieldInfo: string | null;
  portions: number | null;
  ingredients: string[];
  contains: StoreAllergen[];
  mayContain: StoreAllergen[];
  /** Grupos de filtro atingidos por "contém" ou "pode conter" (ex.: gluten). */
  blockedGroups: string[];
  allergensValidated: boolean;
  diet: StoreAllergen[];
  campaigns: string[];
  madeToOrder: boolean;
  available: boolean;
  inSeason: boolean;
  cover: { url: string; alt: string } | null;
  /** Cor da ilustração enquanto não há foto. */
  tone: string;
  /** Dado de demonstração: nunca é um produto à venda. */
  isDemo: boolean;
};

export type StoreCategory = {
  slug: string;
  name: string;
  description: string | null;
  featured: boolean;
};

export type StoreSection = StoreCategory & {
  channel: "loja" | "encomendas";
  children: StoreCategory[];
};

export type StoreCatalog = {
  /** "banco": produtos reais. "demo": nenhum produto ativo ainda (D-031). */
  source: "banco" | "demo";
  products: StoreProduct[];
  sections: StoreSection[];
  whatsapp: string | null;
};

/** Grupos que a loja oferece no filtro "sem alergênico". */
export const FILTER_GROUPS: StoreAllergen[] = [
  { code: "gluten", name: "Glúten" },
  { code: "leite", name: "Leite" },
  { code: "ovos", name: "Ovos" },
  { code: "soja", name: "Soja" },
  { code: "castanhas", name: "Castanhas" },
  { code: "amendoim", name: "Amendoim" },
];

/** Link de WhatsApp com a mensagem já escrita. Null se não houver número. */
export function whatsappLink(
  number: string | null,
  message: string,
): string | null {
  if (!number) return null;
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
