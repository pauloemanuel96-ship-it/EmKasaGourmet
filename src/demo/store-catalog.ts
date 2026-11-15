/**
 * Demonstração da loja sobre a estrutura REAL de categorias (D-031).
 * Só é usada quando o banco ainda não tem nenhum produto ativo.
 * Todo item sai com isDemo = true e a loja mostra o selo "DEMO".
 */
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

/** Em qual categoria real cada produto de demonstração aparece. */
function categoryOf(p: Product): string {
  if (p.unit === "horta") {
    if (p.boxGroup === "frutas") return "frutas";
    if (p.boxGroup === "raizes" || p.boxGroup === "legumes")
      return "legumes-e-raizes";
    return "verduras-e-folhas";
  }
  if (p.unit === "cozinha") return "refeicoes-individuais";
  return p.slug.startsWith("blend") ? "blends-veganos" : "produtos-da-emkasa";
}

/**
 * Produtos com nome real informado pela Emkasa, mas sem ficha recebida:
 * o nome é o real e o resto fica vazio (nada de ingrediente inventado).
 */
const REAL_NAMES: Record<string, string> = {
  "farofa-nutritiva": "Farofa Nutritiva de Soja",
};

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
  for (const p of PRODUCTS) {
    const found = lookup.get(categoryOf(p));
    if (!found) continue; // categoria desativada no painel: some também da demo
    const realName = REAL_NAMES[p.slug];
    const sheet = !realName;
    products.push({
      slug: p.slug,
      name: realName ?? p.name,
      short: realName ? "Ficha técnica ainda não cadastrada." : p.short,
      description: realName ? null : p.description,
      sectionSlug: found.section.slug,
      sectionName: found.section.name,
      categorySlug: categoryOf(p),
      categoryName: found.name,
      path:
        found.section.name === found.name
          ? [found.name]
          : [found.section.name, found.name],
      channel: "loja",
      saleUnit: p.saleUnit,
      unitLabel: p.unitLabel || SALE_UNIT_LABEL[p.saleUnit],
      priceCents: p.priceCents,
      quoteOnly: false,
      storage: p.storage,
      conservation: sheet ? p.conservation : null,
      origin: sheet ? (p.origin ?? null) : null,
      yieldInfo: null,
      portions: null,
      ingredients: sheet ? p.ingredients : [],
      contains: sheet ? toAllergens(p.contains) : [],
      mayContain: sheet ? toAllergens(p.mayContain) : [],
      blockedGroups: sheet
        ? [
            ...new Set(
              [...p.contains, ...p.mayContain].map(
                (c) => ALLERGEN_GROUP[c] ?? c,
              ),
            ),
          ]
        : [],
      allergensValidated: sheet && p.allergensValidated,
      diet: sheet ? p.diet.map((d) => ({ code: d, name: DIET_LABEL[d] })) : [],
      campaigns: [],
      madeToOrder: Boolean(p.madeToOrder),
      available: true,
      inSeason: false,
      cover: null,
      tone: p.tone,
      isDemo: true,
    });
  }
  return { source: "demo", products, sections, whatsapp: null };
}
