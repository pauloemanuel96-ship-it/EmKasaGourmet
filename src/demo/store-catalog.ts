/**
 * Demonstração da loja sobre a estrutura REAL de categorias (D-031).
 * Só é usada quando o banco ainda não tem nenhum produto ativo.
 * Todo item sai com isDemo = true e a loja mostra o selo "DEMO".
 */
import {
  STATIC_COVERS,
  STATIC_GALLERY,
} from "@/modules/catalogo/static-photos";
import { SALE_UNIT_LABEL } from "@/modules/catalogo/types";
import type {
  StoreAllergen,
  StoreCatalog,
  StoreProduct,
  StoreSection,
} from "@/modules/catalogo/store-types";
import { ALLERGEN_LABEL, DIET_LABEL, PRODUCTS, type Product } from "./data";

/** Estrutura semeada pela migration 0006 (usada se o banco não responder). */
export const SEED_SECTIONS: StoreSection[] = [
  {
    slug: "produtos-da-emkasa",
    name: "Produtos da Emkasa",
    description: null,
    featured: false,
    channel: "loja",
    children: [
      {
        slug: "blends-veganos",
        name: "Blends Veganos",
        description: null,
        featured: false,
      },
      {
        slug: "almondegas",
        name: "Almôndegas",
        description: null,
        featured: false,
      },
    ],
  },
  {
    slug: "horta-e-naturais",
    name: "Horta e Naturais",
    description: null,
    featured: false,
    channel: "loja",
    children: [
      { slug: "frutas", name: "Frutas", description: null, featured: false },
      {
        slug: "legumes-e-raizes",
        name: "Legumes e raízes",
        description: null,
        featured: false,
      },
      {
        slug: "verduras-e-folhas",
        name: "Verduras e folhas",
        description: null,
        featured: false,
      },
    ],
  },
  {
    slug: "refeicoes-congeladas",
    name: "Refeições Congeladas",
    description: null,
    featured: false,
    channel: "loja",
    children: [
      {
        slug: "kits-de-refeicoes-congeladas",
        name: "Kits de refeições congeladas",
        description: null,
        featured: false,
      },
      {
        slug: "refeicoes-individuais",
        name: "Refeições individuais",
        description: null,
        featured: false,
      },
      {
        slug: "combos-semanais",
        name: "Combos semanais",
        description: null,
        featured: false,
      },
    ],
  },
  {
    slug: "encomendas-e-confraternizacoes",
    name: "Encomendas e Confraternizações",
    description: null,
    featured: false,
    channel: "encomendas",
    children: [
      {
        slug: "ceia-natural-emkasa",
        name: "Ceia Natural Emkasa",
        description:
          "Preparações naturais, veganas, vegetarianas e acompanhamentos especiais, conforme o cardápio cadastrado.",
        featured: true,
      },
      {
        slug: "ceia-tradicional",
        name: "Ceia Tradicional",
        description:
          "Pratos tradicionais de Natal, carnes e aves, acompanhamentos, saladas e sobremesas, conforme o cardápio cadastrado.",
        featured: true,
      },
      {
        slug: "confraternizacoes-empresariais",
        name: "Confraternizações empresariais",
        description: null,
        featured: false,
      },
      {
        slug: "almocos-e-jantares-especiais",
        name: "Almoços e jantares especiais",
        description: null,
        featured: false,
      },
      {
        slug: "combos-para-familias",
        name: "Combos para famílias",
        description: null,
        featured: false,
      },
      {
        slug: "pratos-para-compartilhar",
        name: "Pratos para compartilhar",
        description: null,
        featured: false,
      },
      {
        slug: "eventos-e-celebracoes",
        name: "Eventos e celebrações",
        description: null,
        featured: false,
      },
    ],
  },
];

/** Em qual categoria real cada produto de horta da demonstração aparece. */
function categoryOf(p: Product): string {
  if (p.boxGroup === "frutas") return "frutas";
  if (p.boxGroup === "raizes" || p.boxGroup === "legumes")
    return "legumes-e-raizes";
  return "verduras-e-folhas";
}

/**
 * Prévias de produtos reais: nome e foto vêm da Emkasa; preço, embalagem,
 * ingredientes e alergênicos ainda não foram cadastrados, então ficam vazios.
 * Quando o produto for cadastrado e ativado no painel, a prévia sai sozinha
 * (a demonstração inteira some assim que houver produto ativo).
 * [CONFIRMAR] a categoria das refeições e saladas com a Emkasa.
 */
const PREVIEWS: {
  slug: string;
  name: string;
  category: string;
  storage?: Product["storage"];
}[] = [
  {
    slug: "farofa-nutritiva-de-soja",
    name: "Farofa Nutritiva de Soja",
    category: "produtos-da-emkasa",
  },
  { slug: "blend-vegano", name: "Blend Vegano", category: "blends-veganos" },
  { slug: "almondegas", name: "Almôndegas", category: "almondegas" },
  { slug: "pate", name: "Patê", category: "produtos-da-emkasa" },
  {
    slug: "pao-integral",
    name: "Pão integral",
    category: "produtos-da-emkasa",
  },
  {
    slug: "quiche-de-soja",
    name: "Quiche de soja",
    category: "refeicoes-individuais",
  },
  {
    slug: "muqueca-de-grao-de-bico",
    name: "Muqueca de grão-de-bico",
    category: "refeicoes-individuais",
  },
  {
    slug: "tomate-recheado-vegetariano",
    name: "Tomate recheado vegetariano",
    category: "refeicoes-individuais",
  },
  {
    slug: "salada-margarita",
    name: "Salada Margarita",
    category: "refeicoes-individuais",
  },
  {
    slug: "salada-no-pote",
    name: "Salada no pote",
    category: "refeicoes-individuais",
  },
];

const ALLERGEN_GROUP: Record<string, string> = {
  gluten: "gluten",
  trigo: "gluten",
  leite: "leite",
  lactose: "leite",
  castanhas: "castanhas",
  castanha_de_caju: "castanhas",
};

function toAllergens(codes: string[]): StoreAllergen[] {
  return codes.map((code) => ({
    code,
    name: ALLERGEN_LABEL[code as keyof typeof ALLERGEN_LABEL] ?? code,
  }));
}

export function demoCatalog(sections: StoreSection[]): StoreCatalog {
  const lookup = new Map<string, { section: StoreSection; name: string }>();
  for (const s of sections) {
    lookup.set(s.slug, { section: s, name: s.name });
    for (const c of s.children)
      lookup.set(c.slug, { section: s, name: c.name });
  }

  const products: StoreProduct[] = [];
  const base = {
    short: null,
    description: null,
    channel: "loja" as const,
    quoteOnly: false,
    conservation: null,
    origin: null,
    yieldInfo: null,
    portions: null,
    campaigns: [],
    madeToOrder: false,
    available: true,
    inSeason: false,
    isDemo: true,
  };
  const place = (category: string) => {
    const found = lookup.get(category);
    if (!found) return null; // categoria desativada no painel: some também da demo
    return {
      sectionSlug: found.section.slug,
      sectionName: found.section.name,
      categorySlug: category,
      categoryName: found.name,
      path:
        found.section.name === found.name
          ? [found.name]
          : [found.section.name, found.name],
    };
  };

  for (const item of PREVIEWS) {
    const where = place(item.category);
    if (!where) continue;
    products.push({
      ...base,
      ...where,
      slug: item.slug,
      name: item.name,
      saleUnit: "un",
      unitLabel: "Embalagem a confirmar",
      priceCents: null,
      storage: item.storage ?? "ambiente",
      ingredients: [],
      contains: [],
      mayContain: [],
      blockedGroups: [],
      allergensValidated: false,
      diet: [],
      cover: STATIC_COVERS[item.slug] ?? null,
      gallery: STATIC_GALLERY[item.slug] ?? [],
      tone: "#7a6a4f",
      comingSoon: true,
    });
  }

  // Horta: itens genéricos de demonstração (sem foto real ainda).
  for (const p of PRODUCTS) {
    if (p.unit !== "horta") continue;
    const where = place(categoryOf(p));
    if (!where) continue;
    products.push({
      ...base,
      ...where,
      slug: p.slug,
      name: p.name,
      short: p.short,
      description: p.description,
      saleUnit: p.saleUnit,
      unitLabel: p.unitLabel || SALE_UNIT_LABEL[p.saleUnit],
      priceCents: p.priceCents,
      storage: p.storage,
      conservation: p.conservation,
      origin: p.origin ?? null,
      ingredients: p.ingredients,
      contains: toAllergens(p.contains),
      mayContain: toAllergens(p.mayContain),
      blockedGroups: [
        ...new Set(
          [...p.contains, ...p.mayContain].map((c) => ALLERGEN_GROUP[c] ?? c),
        ),
      ],
      allergensValidated: p.allergensValidated,
      diet: p.diet.map((d) => ({ code: d, name: DIET_LABEL[d] })),
      cover: null,
      gallery: [],
      tone: p.tone,
      comingSoon: false,
    });
  }
  return { source: "demo", products, sections, whatsapp: null };
}
