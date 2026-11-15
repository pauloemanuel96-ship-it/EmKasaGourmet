import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { as, createTestDb, createUser } from "./harness";

const OWNER = "00000000-0000-0000-0000-0000000000a1";
const OPERACAO = "00000000-0000-0000-0000-0000000000a2";
const CLIENTE = "00000000-0000-0000-0000-0000000000a4";

let db: PGlite;

async function one<T>(sql: string, params: unknown[] = []): Promise<T> {
  const res = await db.query<T>(sql, params);
  return res.rows[0];
}

async function idOf(table: string, column: string, value: string) {
  const row = await one<{ id: string }>(
    `select id from public.${table} where ${column} = $1`,
    [value],
  );
  return row.id;
}

/** Chama uma função do painel como o usuário informado e devolve o resultado. */
async function call<T = string>(
  who: { anon: true } | { userId: string },
  fn: string,
  payload: unknown,
): Promise<T> {
  return as(db, who, async () => {
    const res = await db.query<{ result: T }>(
      `select public.${fn}($1::jsonb) as result`,
      [JSON.stringify(payload)],
    );
    return res.rows[0].result;
  });
}

type CatalogRow = {
  slug: string;
  name: string;
  price_cents: number | null;
  quote_only: boolean;
  channel: string;
  root_slug: string;
  category_slug: string;
  path_names: string[];
  allergens_validated: boolean;
  is_available: boolean;
  in_season: boolean;
  ingredients: string[];
  contains: { code: string; name: string }[];
  may_contain: { code: string; name: string }[];
  blocked_groups: string[];
  diet_labels: { code: string; name: string }[];
  campaigns: string[];
};

async function catalogAsVisitor(): Promise<CatalogRow[]> {
  return as(
    db,
    { anon: true },
    async () =>
      (
        await db.query<CatalogRow>(
          "select * from public.v_store_catalog order by name",
        )
      ).rows,
  );
}

async function productRow(slug: string) {
  return (await catalogAsVisitor()).find((r) => r.slug === slug);
}

beforeAll(async () => {
  db = await createTestDb();
  await createUser(db, OWNER, "owner");
  await createUser(db, OPERACAO, "operacao");
  await createUser(db, CLIENTE);
}, 60_000);

describe("Árvore de categorias", () => {
  it("traz a estrutura informada pela Emkasa, com canal e área herdados", async () => {
    const rows = await as(
      db,
      { anon: true },
      async () =>
        (
          await db.query<{
            slug: string;
            root_slug: string;
            kind: string;
            business_unit: string;
            depth: number;
            is_featured: boolean;
          }>(
            "select slug, root_slug, kind, business_unit, depth, is_featured from public.v_store_categories",
          )
        ).rows,
    );
    expect(rows).toHaveLength(19);
    expect(
      rows
        .filter((r) => r.depth === 0)
        .map((r) => r.slug)
        .sort(),
    ).toEqual([
      "encomendas-e-confraternizacoes",
      "horta-e-naturais",
      "produtos-da-emkasa",
      "refeicoes-congeladas",
    ]);
    expect(rows.find((r) => r.slug === "frutas")).toMatchObject({
      root_slug: "horta-e-naturais",
      kind: "loja",
      business_unit: "horta",
      depth: 1,
    });
    expect(rows.find((r) => r.slug === "ceia-tradicional")).toMatchObject({
      root_slug: "encomendas-e-confraternizacoes",
      kind: "encomendas",
      is_featured: true,
    });
  });

  it("gestor cria subcategoria; ela herda o canal e ganha slug único", async () => {
    const parent = await idOf(
      "categories",
      "slug",
      "encomendas-e-confraternizacoes",
    );
    const id = await call({ userId: OWNER }, "admin_save_category", {
      name: "Frutas",
      parent_id: parent,
      kind: "loja",
      business_unit: "horta",
    });
    const row = await one<{
      slug: string;
      kind: string;
      business_unit: string;
    }>(
      "select slug, kind, business_unit from public.categories where id = $1",
      [id],
    );
    expect(row).toEqual({
      slug: "frutas-2",
      kind: "encomendas",
      business_unit: "cozinha",
    });
    await db.query("delete from public.categories where id = $1", [id]);
  });

  it("operação, cliente e visitante não alteram categorias", async () => {
    for (const who of [{ userId: OPERACAO }, { userId: CLIENTE }]) {
      await expect(
        call(who, "admin_save_category", { name: "X" }),
      ).rejects.toThrow(/administração/);
    }
    await expect(
      call({ anon: true }, "admin_save_category", { name: "X" }),
    ).rejects.toThrow(/permission denied/);
  });

  it("impede colocar uma categoria dentro de uma filha dela", async () => {
    const root = await idOf("categories", "slug", "horta-e-naturais");
    const child = await idOf("categories", "slug", "frutas");
    await expect(
      call({ userId: OWNER }, "admin_save_category", {
        id: root,
        name: "Horta e Naturais",
        parent_id: child,
        kind: "loja",
        business_unit: "horta",
      }),
    ).rejects.toThrow(/dentro dela mesma/);
  });

  it("desativar a categoria-mãe esconde a árvore inteira do visitante, sem apagar", async () => {
    const root = await idOf("categories", "slug", "refeicoes-congeladas");
    await db.query(
      "update public.categories set is_active = false where id = $1",
      [root],
    );
    const visible = await as(db, { anon: true }, async () =>
      (
        await db.query<{ slug: string }>(
          "select slug from public.v_store_categories",
        )
      ).rows.map((r) => r.slug),
    );
    expect(visible).not.toContain("refeicoes-congeladas");
    expect(visible).not.toContain("refeicoes-individuais");
    const kept = await one<{ n: number }>(
      "select count(*)::int as n from public.categories where slug in ('refeicoes-congeladas','refeicoes-individuais')",
    );
    expect(kept.n).toBe(2);
    await db.query(
      "update public.categories set is_active = true where id = $1",
      [root],
    );
  });
});

describe("Cadastro de produto pelo painel", () => {
  let farinha: string;
  let aveia: string;
  let amendoa: string;
  let produtos: string;
  let productId: string;

  it("gestor cadastra ingredientes com alergênicos; nome repetido é recusado", async () => {
    const trigo = await idOf("allergens", "code", "trigo");
    const aveiaAl = await idOf("allergens", "code", "aveia");
    const amendoaAl = await idOf("allergens", "code", "amendoa");
    farinha = await call({ userId: OWNER }, "admin_save_ingredient", {
      name: "[DEMO] Farinha de trigo",
      allergen_ids: [trigo],
    });
    aveia = await call({ userId: OWNER }, "admin_save_ingredient", {
      name: "[DEMO] Aveia",
      allergen_ids: [aveiaAl],
    });
    amendoa = await call({ userId: OWNER }, "admin_save_ingredient", {
      name: "[DEMO] Amêndoa",
      allergen_ids: [amendoaAl],
    });
    await expect(
      call({ userId: OWNER }, "admin_save_ingredient", {
        name: "[demo] farinha de TRIGO",
      }),
    ).rejects.toThrow(/Já existe/);
    await expect(
      call({ userId: OPERACAO }, "admin_save_ingredient", { name: "X" }),
    ).rejects.toThrow(/administração/);
  });

  it("cria produto ativo com ficha; a loja recebe só o que é público", async () => {
    produtos = await idOf("categories", "slug", "produtos-da-emkasa");
    const soja = await idOf("allergens", "code", "soja");
    productId = await call({ userId: OWNER }, "admin_save_product", {
      name: "[DEMO] Granola da Casa",
      category_id: produtos,
      sale_unit: "pote",
      unit_size: "0.3",
      price_cents: 1500,
      status: "active",
      stock_mode: "untracked",
      storage: "ambiente",
      seasonal_months: [3, 1, 3],
      ingredient_ids: [aveia, amendoa],
      may_contain_ids: [soja],
    });

    const row = await productRow("demo-granola-da-casa");
    expect(row).toMatchObject({
      name: "[DEMO] Granola da Casa",
      price_cents: 1500,
      channel: "loja",
      root_slug: "produtos-da-emkasa",
      category_slug: "produtos-da-emkasa",
      path_names: ["Produtos da Emkasa"],
      allergens_validated: false,
      is_available: true,
      ingredients: ["[DEMO] Aveia", "[DEMO] Amêndoa"],
      contains: [
        { code: "amendoa", name: "Amêndoa" },
        { code: "aveia", name: "Aveia" },
      ],
      may_contain: [{ code: "soja", name: "Soja" }],
      // amêndoa conta como "castanhas"; aveia conta como "glúten"
      blocked_groups: ["castanhas", "gluten", "soja"],
      diet_labels: [],
    });
    const months = await one<{
      seasonal_months: number[];
      business_unit: string;
    }>(
      "select seasonal_months, business_unit from public.products where id = $1",
      [productId],
    );
    expect(months).toEqual({
      seasonal_months: [1, 3],
      business_unit: "produtos",
    });
  });

  it("rótulo que contraria a ficha é recusado; sem evidência também", async () => {
    const semGluten = await idOf("diet_labels", "code", "sem_gluten");
    const vegano = await idOf("diet_labels", "code", "vegano");
    const base = {
      id: productId,
      name: "[DEMO] Granola da Casa",
      category_id: produtos,
      sale_unit: "pote",
      price_cents: 1500,
      status: "active",
      stock_mode: "untracked",
    };
    await expect(
      call({ userId: OWNER }, "admin_save_product", {
        ...base,
        diet_labels: [{ label_id: semGluten, evidence: "laudo" }],
      }),
    ).rejects.toThrow(/conflito.*Sem glúten × Aveia/);
    await expect(
      call({ userId: OWNER }, "admin_save_product", {
        ...base,
        diet_labels: [{ label_id: vegano, evidence: "  " }],
      }),
    ).rejects.toThrow(/evidência/);
  });

  it("rótulo aprovado só aparece depois que a ficha de alergênicos é validada", async () => {
    const vegano = await idOf("diet_labels", "code", "vegano");
    await call({ userId: OWNER }, "admin_save_product", {
      id: productId,
      name: "[DEMO] Granola da Casa",
      category_id: produtos,
      sale_unit: "pote",
      price_cents: 1500,
      status: "active",
      stock_mode: "untracked",
      diet_labels: [{ label_id: vegano, evidence: "composição 100% vegetal" }],
    });
    expect((await productRow("demo-granola-da-casa"))?.diet_labels).toEqual([]);

    await as(db, { userId: OWNER }, () =>
      db.query("select public.validate_product_allergens($1)", [productId]),
    );
    expect(await productRow("demo-granola-da-casa")).toMatchObject({
      allergens_validated: true,
      diet_labels: [{ code: "vegano", name: "Vegano" }],
    });
  });

  it("salvar de novo sem mexer na ficha mantém a validação; mudar ingrediente derruba", async () => {
    const payload = {
      id: productId,
      name: "[DEMO] Granola da Casa",
      category_id: produtos,
      sale_unit: "pote",
      price_cents: 1800,
      status: "active",
      stock_mode: "untracked",
      ingredient_ids: [aveia, amendoa],
      may_contain_ids: [await idOf("allergens", "code", "soja")],
    };
    await call({ userId: OWNER }, "admin_save_product", payload);
    expect(await productRow("demo-granola-da-casa")).toMatchObject({
      price_cents: 1800,
      allergens_validated: true,
    });

    await call({ userId: OWNER }, "admin_save_product", {
      ...payload,
      ingredient_ids: [aveia, amendoa, farinha],
    });
    const row = await productRow("demo-granola-da-casa");
    expect(row?.allergens_validated).toBe(false);
    expect(row?.contains.map((c) => c.code)).toEqual([
      "amendoa",
      "aveia",
      "trigo",
    ]);
  });

  it("ingrediente que passa a ter leite derruba o rótulo vegano na loja", async () => {
    const leite = await idOf("allergens", "code", "leite");
    const amendoaAl = await idOf("allergens", "code", "amendoa");
    await as(db, { userId: OWNER }, () =>
      db.query("select public.validate_product_allergens($1)", [productId]),
    );
    expect(
      (await productRow("demo-granola-da-casa"))?.diet_labels,
    ).toHaveLength(1);

    await call({ userId: OWNER }, "admin_save_ingredient", {
      id: amendoa,
      name: "[DEMO] Amêndoa",
      allergen_ids: [amendoaAl, leite],
    });
    // Mesmo que alguém valide a ficha de novo, o rótulo incompatível não volta.
    await as(db, { userId: OWNER }, () =>
      db.query("select public.validate_product_allergens($1)", [productId]),
    );
    const row = await productRow("demo-granola-da-casa");
    expect(row?.blocked_groups).toContain("leite");
    expect(row?.diet_labels).toEqual([]);
  });

  it("operação cria rascunho simples, mas não edita, não publica e não mexe na ficha", async () => {
    const frutas = await idOf("categories", "slug", "frutas");
    const id = await call({ userId: OPERACAO }, "admin_save_product", {
      name: "[DEMO] Fruta nova",
      category_id: frutas,
      sale_unit: "kg",
    });
    const row = await one<{ status: string; business_unit: string }>(
      "select status, business_unit from public.products where id = $1",
      [id],
    );
    expect(row).toEqual({ status: "draft", business_unit: "horta" });

    const base = { name: "[DEMO] Outra", category_id: frutas, sale_unit: "kg" };
    await expect(
      call({ userId: OPERACAO }, "admin_save_product", { ...base, id }),
    ).rejects.toThrow(/administração/);
    await expect(
      call({ userId: OPERACAO }, "admin_save_product", {
        ...base,
        status: "active",
        price_cents: 100,
      }),
    ).rejects.toThrow(/rascunhos/);
    await expect(
      call({ userId: OPERACAO }, "admin_save_product", {
        ...base,
        ingredient_ids: [],
      }),
    ).rejects.toThrow(/administração/);
    await expect(
      as(db, { userId: OPERACAO }, () =>
        db.query("select public.admin_set_product_status($1, 'active')", [id]),
      ),
    ).rejects.toThrow(/administração/);
  });

  it("cliente logado e visitante não chegam às funções do painel", async () => {
    const frutas = await idOf("categories", "slug", "frutas");
    const payload = { name: "X", category_id: frutas, sale_unit: "kg" };
    await expect(
      call({ userId: CLIENTE }, "admin_save_product", payload),
    ).rejects.toThrow(/Sem permissão/);
    await expect(
      call({ anon: true }, "admin_save_product", payload),
    ).rejects.toThrow(/permission denied/);
  });

  it("não ativa sem preço, a menos que seja sob orçamento", async () => {
    const ceia = await idOf("categories", "slug", "ceia-tradicional");
    const base = {
      name: "[DEMO] Prato de ceia",
      category_id: ceia,
      sale_unit: "un",
      status: "active",
      stock_mode: "made_to_order",
      portions: 8,
    };
    await expect(
      call({ userId: OWNER }, "admin_save_product", base),
    ).rejects.toThrow(/informe o preço/);

    await call({ userId: OWNER }, "admin_save_product", {
      ...base,
      quote_only: true,
    });
    expect(await productRow("demo-prato-de-ceia")).toMatchObject({
      price_cents: null,
      quote_only: true,
      channel: "encomendas",
      root_slug: "encomendas-e-confraternizacoes",
      path_names: ["Encomendas e Confraternizações", "Ceia Tradicional"],
      is_available: true,
    });
  });

  it("campanha só aparece no produto quando está ligada", async () => {
    const natal = await idOf("campaigns", "slug", "natal");
    const ceia = await idOf("categories", "slug", "ceia-tradicional");
    const id = await idOf("products", "slug", "demo-prato-de-ceia");
    await call({ userId: OWNER }, "admin_save_product", {
      id,
      name: "[DEMO] Prato de ceia",
      category_id: ceia,
      sale_unit: "un",
      status: "active",
      stock_mode: "made_to_order",
      quote_only: true,
      campaign_ids: [natal],
    });
    expect((await productRow("demo-prato-de-ceia"))?.campaigns).toEqual([]);

    await call({ userId: OWNER }, "admin_save_campaign", {
      id: natal,
      name: "Natal",
      is_active: true,
      order_deadline: "2026-12-20",
    });
    expect((await productRow("demo-prato-de-ceia"))?.campaigns).toEqual([
      "natal",
    ]);
    const visible = await as(db, { anon: true }, async () =>
      (
        await db.query<{ slug: string }>("select slug from public.campaigns")
      ).rows.map((r) => r.slug),
    );
    expect(visible).toEqual(["natal"]);
  });

  it("rascunho, arquivado e produto de categoria desativada ficam fora da loja", async () => {
    const id = await idOf("products", "slug", "demo-prato-de-ceia");
    await as(db, { userId: OWNER }, () =>
      db.query("select public.admin_set_product_status($1, 'archived')", [id]),
    );
    expect(await productRow("demo-prato-de-ceia")).toBeUndefined();
    await as(db, { userId: OWNER }, () =>
      db.query("select public.admin_set_product_status($1, 'active')", [id]),
    );
    expect(await productRow("demo-prato-de-ceia")).toBeDefined();

    const ceia = await idOf("categories", "slug", "ceia-tradicional");
    await db.query(
      "update public.categories set is_active = false where id = $1",
      [ceia],
    );
    expect(await productRow("demo-prato-de-ceia")).toBeUndefined();
    await db.query(
      "update public.categories set is_active = true where id = $1",
      [ceia],
    );

    const slugs = (await catalogAsVisitor()).map((r) => r.slug);
    expect(slugs).not.toContain("demo-fruta-nova");
  });

  it("produto com estoque controlado e sem saldo aparece como indisponível", async () => {
    const frutas = await idOf("categories", "slug", "frutas");
    await call({ userId: OWNER }, "admin_save_product", {
      name: "[DEMO] Fruta controlada",
      category_id: frutas,
      sale_unit: "kg",
      price_cents: 900,
      status: "active",
      stock_mode: "tracked",
    });
    expect(await productRow("demo-fruta-controlada")).toMatchObject({
      is_available: false,
      in_season: false,
    });
  });

  it("toda alteração do painel fica na auditoria com o autor", async () => {
    const row = await one<{ actor_id: string; action: string }>(
      `select actor_id, action from public.audit_log
        where table_name = 'products' and record_id = $1
        order by id limit 1`,
      [productId],
    );
    expect(row).toEqual({ actor_id: OWNER, action: "insert" });
  });
});

describe("Slugs", () => {
  it("tira acento, espaço e pontuação", async () => {
    const row = await one<{ a: string; b: string | null }>(
      "select public.slugify('  Ceia de Natal — Família & Amigos! ') as a, public.slugify('***') as b",
    );
    expect(row).toEqual({ a: "ceia-de-natal-familia-amigos", b: null });
  });
});
