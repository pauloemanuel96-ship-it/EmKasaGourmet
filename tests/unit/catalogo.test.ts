import { describe, expect, it } from "vitest";
import { centsToInput, parseBRLToCents } from "@/lib/money";
import {
  categorySchema,
  productSchema,
  readCategoryForm,
  readProductForm,
  toCategoryPayload,
  toProductPayload,
} from "@/modules/catalogo/schemas";
import { descendantIds, flattenTree } from "@/modules/catalogo/tree";
import type { Category } from "@/modules/catalogo/types";

const CAT = "11111111-1111-4111-8111-111111111111";
const ING_A = "22222222-2222-4222-8222-222222222222";
const ING_B = "33333333-3333-4333-8333-333333333333";
const LABEL = "44444444-4444-4444-8444-444444444444";

function form(entries: [string, string][]) {
  const fd = new FormData();
  for (const [k, v] of entries) fd.append(k, v);
  return fd;
}

describe("parseBRLToCents", () => {
  it.each([
    ["24,90", 2490],
    ["R$ 1.234,56", 123456],
    ["12.5", 1250],
    ["1.234", 123400],
    ["7", 700],
    ["0,05", 5],
  ])("%s → %i", (input, cents) => {
    expect(parseBRLToCents(input)).toBe(cents);
  });

  it("vazio é null; texto inválido é undefined", () => {
    expect(parseBRLToCents("  ")).toBeNull();
    expect(parseBRLToCents("doze")).toBeUndefined();
    expect(parseBRLToCents("12,505")).toBeUndefined();
    expect(parseBRLToCents("-3")).toBeUndefined();
  });

  it("volta para o campo no formato brasileiro", () => {
    expect(centsToInput(2490)).toBe("24,90");
    expect(centsToInput(5)).toBe("0,05");
    expect(centsToInput(null)).toBe("");
  });
});

describe("formulário de categoria", () => {
  it("monta o JSON da função com checkboxes e campos vazios", () => {
    const parsed = categorySchema.parse(
      readCategoryForm(
        form([
          ["name", "  Molhos "],
          ["parent_id", ""],
          ["kind", "loja"],
          ["business_unit", "produtos"],
          ["description", ""],
          ["is_active", "on"],
          ["sort_order", ""],
        ]),
      ),
    );
    expect(toCategoryPayload(parsed)).toEqual({
      id: null,
      name: "Molhos",
      parent_id: null,
      kind: "loja",
      business_unit: "produtos",
      description: null,
      is_featured: false,
      is_active: true,
      sort_order: null,
    });
  });

  it("exige nome", () => {
    const r = categorySchema.safeParse(readCategoryForm(form([["name", " "]])));
    expect(r.success).toBe(false);
  });
});

describe("formulário de produto", () => {
  const base: [string, string][] = [
    ["name", "[DEMO] Blend Vegano"],
    ["category_id", CAT],
    ["sale_unit", "pote"],
    ["unit_size", "0,5"],
    ["price", "24,90"],
    ["status", "active"],
    ["seasonal_months", "12"],
    ["seasonal_months", "1"],
  ];

  it("converte preço, tamanho e meses; sem ficha não manda as chaves da ficha", () => {
    const payload = toProductPayload(
      productSchema.parse(readProductForm(form(base))),
    );
    expect(payload).toMatchObject({
      price_cents: 2490,
      unit_size: "0.5",
      quote_only: false,
      seasonal_months: [1, 12],
    });
    expect(payload).not.toHaveProperty("ingredient_ids");
    expect(payload).not.toHaveProperty("diet_labels");
  });

  it("com a ficha, mantém a ordem dos ingredientes e junta a evidência ao rótulo", () => {
    const payload = toProductPayload(
      productSchema.parse(
        readProductForm(
          form([
            ...base,
            ["sheet", "1"],
            ["ingredient_ids", ING_B],
            ["ingredient_ids", ING_A],
            ["label_ids", LABEL],
            [`evidence_${LABEL}`, "Ficha técnica 10/11"],
          ]),
        ),
      ),
    );
    expect(payload).toMatchObject({
      ingredient_ids: [ING_B, ING_A],
      may_contain_ids: [],
      diet_labels: [{ label_id: LABEL, evidence: "Ficha técnica 10/11" }],
      campaign_ids: [],
    });
  });

  it("não deixa pôr à venda sem preço, exceto sob orçamento", () => {
    const semPreco = base.map(([k, v]) =>
      k === "price" ? ([k, ""] as [string, string]) : [k, v],
    ) as [string, string][];
    const r = productSchema.safeParse(readProductForm(form(semPreco)));
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["price_cents"]);

    const orcamento = productSchema.safeParse(
      readProductForm(form([...semPreco, ["quote_only", "on"]])),
    );
    expect(orcamento.success).toBe(true);
  });

  it("recusa preço escrito errado com mensagem no campo", () => {
    const r = productSchema.safeParse(
      readProductForm(
        form(
          base.map(([k, v]) =>
            k === "price" ? ["price", "doze reais"] : [k, v],
          ) as [string, string][],
        ),
      ),
    );
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["price_cents"]);
  });
});

describe("árvore de categorias", () => {
  const cat = (
    id: string,
    name: string,
    parent: string | null,
    sort: number,
    active = true,
  ): Category => ({
    id,
    name,
    slug: id,
    parent_id: parent,
    kind: "loja",
    business_unit: "produtos",
    description: null,
    is_featured: false,
    is_active: active,
    sort_order: sort,
  });
  const list = [
    cat("b", "Horta", null, 20),
    cat("a", "Produtos", null, 10, false),
    cat("a1", "Blends", "a", 10),
    cat("a1x", "Sabores", "a1", 10),
    cat("b1", "Frutas", "b", 10),
  ];

  it("ordena mãe antes das filhas e marca o que a mãe inativa esconde", () => {
    const nodes = flattenTree(list);
    expect(nodes.map((n) => `${n.depth}:${n.name}`)).toEqual([
      "0:Produtos",
      "1:Blends",
      "2:Sabores",
      "0:Horta",
      "1:Frutas",
    ]);
    expect(nodes.find((n) => n.id === "a1x")?.visible).toBe(false);
    expect(nodes.find((n) => n.id === "b1")?.path).toEqual(["Horta", "Frutas"]);
  });

  it("lista a categoria e todas as descendentes", () => {
    expect([...descendantIds(list, "a")].sort()).toEqual(["a", "a1", "a1x"]);
  });
});

describe("ingrediente, campanha e WhatsApp", () => {
  it("ingrediente: junta alergênicos sem repetir", async () => {
    const { ingredientSchema, readIngredientForm, toIngredientPayload } =
      await import("@/modules/catalogo/schemas");
    const payload = toIngredientPayload(
      ingredientSchema.parse(
        readIngredientForm(
          form([
            ["name", "Proteína texturizada de soja"],
            ["is_derived_from", ""],
            ["allergen_ids", ING_A],
            ["allergen_ids", ING_A],
          ]),
        ),
      ),
    );
    expect(payload).toEqual({
      id: null,
      name: "Proteína texturizada de soja",
      is_derived_from: null,
      allergen_ids: [ING_A],
    });
  });

  it("campanha: recusa fim antes do início e prazo depois do fim", async () => {
    const { campaignSchema, readCampaignForm } =
      await import("@/modules/catalogo/schemas");
    const r = campaignSchema.safeParse(
      readCampaignForm(
        form([
          ["name", "Natal"],
          ["starts_on", "2026-12-01"],
          ["ends_on", "2026-11-30"],
          ["order_deadline", "2026-12-20"],
        ]),
      ),
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map((i) => i.path[0]).sort()).toEqual([
        "ends_on",
        "order_deadline",
      ]);
    }
  });

  it("WhatsApp: aceita formatos comuns e grava em E.164", async () => {
    const { normalizeWhatsapp } = await import("@/modules/catalogo/schemas");
    expect(normalizeWhatsapp("(79) 99999-1234")).toBe("+5579999991234");
    expect(normalizeWhatsapp("+55 79 3211-0000")).toBe("+557932110000");
    expect(normalizeWhatsapp("")).toBeNull();
    expect(normalizeWhatsapp("1234")).toBeUndefined();
    expect(normalizeWhatsapp("+1 415 555 0100")).toBeUndefined();
  });
});

describe("loja", () => {
  it("filtro 'sem alergênico' exclui pode conter e ficha não validada", async () => {
    const { filterProducts } = await import("@/modules/catalogo/store-filter");
    const { demoCatalog, SEED_SECTIONS } = await import("@/demo/store-catalog");
    const base = demoCatalog(SEED_SECTIONS).products[0];
    const mk = (slug: string, over: Partial<typeof base>) => ({
      ...base,
      slug,
      ...over,
    });
    const products = [
      mk("a", { allergensValidated: true, blockedGroups: [] }),
      mk("b", { allergensValidated: true, blockedGroups: ["gluten"] }),
      mk("c", { allergensValidated: false, blockedGroups: [] }),
    ];
    const r = filterProducts(products, {
      secao: null,
      categoria: null,
      busca: "",
      sem: ["gluten"],
      dieta: null,
      soDisponiveis: false,
      isAvailable: () => true,
    });
    expect(r.map((p) => p.slug)).toEqual(["a"]);
  });

  it("demonstração: tudo marcado DEMO, nome real sem ficha inventada", async () => {
    const { demoCatalog, SEED_SECTIONS } = await import("@/demo/store-catalog");
    const { products } = demoCatalog(SEED_SECTIONS);
    expect(products.length).toBeGreaterThan(0);
    expect(products.every((p) => p.isDemo)).toBe(true);
    const farofa = products.find((p) => p.name === "Farofa Nutritiva de Soja");
    expect(farofa).toMatchObject({
      ingredients: [],
      contains: [],
      allergensValidated: false,
      diet: [],
      sectionSlug: "produtos-da-emkasa",
    });
  });

  it("demonstração some junto com a seção desativada no painel", async () => {
    const { demoCatalog, SEED_SECTIONS } = await import("@/demo/store-catalog");
    const semHorta = SEED_SECTIONS.filter((s) => s.slug !== "horta-e-naturais");
    const { products } = demoCatalog(semHorta);
    expect(products.some((p) => p.sectionSlug === "horta-e-naturais")).toBe(
      false,
    );
  });

  it("rótulo de unidade com tamanho", async () => {
    const { unitLabelOf } = await import("@/modules/catalogo/store-mapping");
    expect(unitLabelOf("pote", "500.000")).toBe("Pote 500 g");
    expect(unitLabelOf("kg", 1.5)).toBe("1,5 kg");
    expect(unitLabelOf("maco", null)).toBe("Maço");
    expect(unitLabelOf("kit", "2")).toBe("Kit");
  });

  it("link do WhatsApp leva a mensagem pronta", async () => {
    const { whatsappLink } = await import("@/modules/catalogo/store-types");
    expect(whatsappLink(null, "oi")).toBeNull();
    expect(whatsappLink("+5579999991234", "Olá! Ceia")).toBe(
      "https://wa.me/5579999991234?text=Ol%C3%A1!%20Ceia",
    );
  });
});

describe("fotos reais", () => {
  it("produto real com o slug da foto ganha a foto; foto do painel tem prioridade", async () => {
    const { toStoreProduct } = await import("@/modules/catalogo/store-mapping");
    const row = {
      slug: "farofa-nutritiva-de-soja",
      name: "Farofa Nutritiva de Soja",
      sale_unit: "pote",
      unit_size: null,
      cover: null,
      path_names: [],
    } as unknown as Parameters<typeof toStoreProduct>[0];
    expect(toStoreProduct(row, "https://x.supabase.co").cover?.url).toBe(
      "/fotos/farofa-nutritiva-de-soja.webp",
    );
    const withDb = { ...row, cover: { path: "a/b.webp", alt: "x" } };
    expect(toStoreProduct(withDb, "https://x.supabase.co").cover?.url).toBe(
      "https://x.supabase.co/storage/v1/object/public/produtos/a/b.webp",
    );
  });

  it("demonstração: Blend Vegano com foto e sem embalagem inventada", async () => {
    const { demoCatalog, SEED_SECTIONS } = await import("@/demo/store-catalog");
    const { products } = demoCatalog(SEED_SECTIONS);
    const blend = products.find((p) => p.name === "Blend Vegano");
    expect(blend).toMatchObject({
      unitLabel: "Embalagem a confirmar",
      cover: { url: "/fotos/blend-vegano.webp" },
      ingredients: [],
      categorySlug: "blends-veganos",
    });
    expect(products.some((p) => p.slug === "blend-golden")).toBe(false);
  });
});

describe("prévias de produtos reais", () => {
  it("nome e foto reais, sem preço nem ficha inventados; refeições fictícias saíram", async () => {
    const { demoCatalog, SEED_SECTIONS } = await import("@/demo/store-catalog");
    const { products } = demoCatalog(SEED_SECTIONS);
    const previews = products.filter((p) => p.comingSoon);
    expect(previews.map((p) => p.slug)).toContain("quiche-de-soja");
    expect(
      previews.every((p) => p.priceCents === null && p.cover !== null),
    ).toBe(true);
    expect(
      previews.every(
        (p) => p.ingredients.length === 0 && !p.allergensValidated,
      ),
    ).toBe(true);
    expect(
      products.find((p) => p.slug === "farofa-nutritiva-de-soja")?.gallery,
    ).toHaveLength(2);
    expect(products.some((p) => p.slug === "lasanha-vegana-berinjela")).toBe(
      false,
    );
  });
});
