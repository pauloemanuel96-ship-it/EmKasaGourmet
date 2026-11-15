import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { as, createTestDb, createUser } from "./harness";

const OWNER = "00000000-0000-0000-0000-000000000001";
const OPERACAO = "00000000-0000-0000-0000-000000000002";
const ATENDIMENTO = "00000000-0000-0000-0000-000000000003";
const CLIENTE = "00000000-0000-0000-0000-000000000004";

let db: PGlite;
let categoryId: string;
let activeProductId: string;
let draftProductId: string;
let locationId: string;

async function one<T>(sql: string, params: unknown[] = []): Promise<T> {
  const res = await db.query<T>(sql, params);
  return res.rows[0];
}

async function stockOf(productId: string) {
  return one<{ on_hand: string; reserved: string; available: string }>(
    "select on_hand, reserved, available from public.stock_levels where product_id = $1",
    [productId],
  );
}

beforeAll(async () => {
  db = await createTestDb();
  await createUser(db, OWNER, "owner");
  await createUser(db, OPERACAO, "operacao");
  await createUser(db, ATENDIMENTO, "atendimento");
  await createUser(db, CLIENTE);

  ({ id: locationId } = await one<{ id: string }>(
    "insert into public.locations (name, kind) values ('[DEMO] Cozinha', 'cozinha') returning id",
  ));
  ({ id: categoryId } = await one<{ id: string }>(
    "insert into public.categories (name, slug, business_unit) values ('[DEMO] Produtos', 'demo-produtos', 'produtos') returning id",
  ));
  ({ id: activeProductId } = await one<{ id: string }>(
    `insert into public.products (slug, name, business_unit, category_id, sale_unit, price_cents, status)
     values ('demo-farofa', '[DEMO] Farofa', 'produtos', $1, 'pote', 1000, 'active') returning id`,
    [categoryId],
  ));
  ({ id: draftProductId } = await one<{ id: string }>(
    `insert into public.products (slug, name, business_unit, sale_unit)
     values ('demo-rascunho', '[DEMO] Rascunho', 'cozinha', 'porcao') returning id`,
  ));
}, 60_000);

describe("RLS", () => {
  it("todas as tabelas de public têm RLS ligado", async () => {
    const res = await db.query<{ relname: string }>(
      `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
    );
    expect(res.rows.map((r) => r.relname)).toEqual([]);
  });

  it("visitante vê só produtos ativos", async () => {
    const rows = await as(db, { anon: true }, async () =>
      (
        await db.query<{ slug: string }>("select slug from public.products")
      ).rows.map((r) => r.slug),
    );
    expect(rows).toEqual(["demo-farofa"]);
  });

  it("visitante e cliente não alteram o catálogo", async () => {
    await expect(
      as(db, { anon: true }, () =>
        db.query("update public.products set price_cents = 1 where id = $1", [
          activeProductId,
        ]),
      ),
    ).rejects.toThrow();

    const updated = await as(
      db,
      { userId: CLIENTE },
      async () =>
        (
          await db.query(
            "update public.products set price_cents = 1 where id = $1 returning id",
            [activeProductId],
          )
        ).rows.length,
    );
    expect(updated).toBe(0);
  });

  it("operação cria rascunho mas não publica nem muda preço", async () => {
    await as(db, { userId: OPERACAO }, () =>
      db.query(
        `insert into public.products (slug, name, business_unit, sale_unit)
         values ('demo-lasanha', '[DEMO] Lasanha', 'cozinha', 'porcao')`,
      ),
    );
    await expect(
      as(db, { userId: OPERACAO }, () =>
        db.query(
          `insert into public.products (slug, name, business_unit, category_id, sale_unit, price_cents, status)
           values ('demo-publicado', '[DEMO] X', 'cozinha', $1, 'porcao', 100, 'active')`,
          [categoryId],
        ),
      ),
    ).rejects.toThrow();

    const updated = await as(
      db,
      { userId: OPERACAO },
      async () =>
        (
          await db.query(
            "update public.products set price_cents = 1 where id = $1 returning id",
            [activeProductId],
          )
        ).rows.length,
    );
    expect(updated).toBe(0);
  });

  it("audit_log só é visível para gestores", async () => {
    const forOperacao = await as(
      db,
      { userId: OPERACAO },
      async () =>
        (await db.query("select 1 from public.audit_log")).rows.length,
    );
    const forOwner = await as(
      db,
      { userId: OWNER },
      async () =>
        (await db.query("select 1 from public.audit_log")).rows.length,
    );
    expect(forOperacao).toBe(0);
    expect(forOwner).toBeGreaterThan(0);
  });
});

describe("Estoque (livro-razão)", () => {
  it("operação registra entrada e o saldo é atualizado", async () => {
    await as(db, { userId: OPERACAO }, () =>
      db.query(
        "select public.register_stock_movement($1, 10, 'stock_in', 'chegada')",
        [activeProductId],
      ),
    );
    expect(await stockOf(activeProductId)).toMatchObject({
      on_hand: "10.000",
      available: "10.000",
    });
  });

  it("modo absoluto ('temos 8') gera um ajuste", async () => {
    await as(db, { userId: OPERACAO }, () =>
      db.query(
        "select public.register_stock_movement($1, 8, 'adjustment', null, 'absolute')",
        [activeProductId],
      ),
    );
    expect(await stockOf(activeProductId)).toMatchObject({ on_hand: "8.000" });
    const last = await one<{
      quantity: string;
      reason: string;
      actor_id: string;
    }>(
      "select quantity, reason, actor_id from public.inventory_movements order by id desc limit 1",
    );
    expect(last).toEqual({
      quantity: "-2.000",
      reason: "adjustment",
      actor_id: OPERACAO,
    });
  });

  it("não deixa o saldo ficar negativo", async () => {
    await expect(
      as(db, { userId: OPERACAO }, () =>
        db.query("select public.register_stock_movement($1, -50, 'loss')", [
          activeProductId,
        ]),
      ),
    ).rejects.toThrow(/Estoque insuficiente/);
    expect(await stockOf(activeProductId)).toMatchObject({ on_hand: "8.000" });
  });

  it("reserva não pode passar do disponível", async () => {
    await db.query(
      "insert into public.inventory_movements (product_id, location_id, quantity, reason, source) values ($1, $2, 5, 'reserve', 'system')",
      [activeProductId, locationId],
    );
    expect(await stockOf(activeProductId)).toMatchObject({
      reserved: "5.000",
      available: "3.000",
    });
    await expect(
      db.query(
        "insert into public.inventory_movements (product_id, location_id, quantity, reason, source) values ($1, $2, 4, 'reserve', 'system')",
        [activeProductId, locationId],
      ),
    ).rejects.toThrow(/Estoque insuficiente/);
  });

  it("motivos do sistema de pedidos são bloqueados no painel", async () => {
    await expect(
      as(db, { userId: OWNER }, () =>
        db.query("select public.register_stock_movement($1, 1, 'sale')", [
          activeProductId,
        ]),
      ),
    ).rejects.toThrow(/exclusivo do sistema/);
  });

  it("atendimento e visitante não movimentam estoque", async () => {
    await expect(
      as(db, { userId: ATENDIMENTO }, () =>
        db.query("select public.register_stock_movement($1, 1, 'stock_in')", [
          activeProductId,
        ]),
      ),
    ).rejects.toThrow(/Sem permissão/);
    await expect(
      as(db, { anon: true }, () =>
        db.query("select public.register_stock_movement($1, 1, 'stock_in')", [
          activeProductId,
        ]),
      ),
    ).rejects.toThrow();
  });

  it("movimentos são imutáveis", async () => {
    await expect(
      db.query("update public.inventory_movements set quantity = 999"),
    ).rejects.toThrow(/somente inserção/);
    await expect(
      db.query("delete from public.inventory_movements"),
    ).rejects.toThrow(/somente inserção/);
  });

  it("disponibilidade: ativo com saldo aparece; rascunho não", async () => {
    const rows = await as(
      db,
      { anon: true },
      async () =>
        (
          await db.query<{ product_id: string; is_available: boolean }>(
            "select product_id, is_available from public.v_product_availability",
          )
        ).rows,
    );
    expect(rows).toEqual([{ product_id: activeProductId, is_available: true }]);
    expect(rows.find((r) => r.product_id === draftProductId)).toBeUndefined();
  });

  it("visitante não lê o saldo: nem a tabela, nem a quantidade na view", async () => {
    await expect(
      as(db, { anon: true }, () =>
        db.query("select * from public.stock_levels"),
      ),
    ).rejects.toThrow(/permission denied/);

    const anonRows = await as(
      db,
      { anon: true },
      async () =>
        (
          await db.query<{ available_quantity: string | null }>(
            "select available_quantity from public.v_product_availability",
          )
        ).rows,
    );
    expect(anonRows.every((r) => r.available_quantity === null)).toBe(true);

    const staffRows = await as(
      db,
      { userId: OPERACAO },
      async () =>
        (
          await db.query<{ product_id: string; available_quantity: string }>(
            "select product_id, available_quantity from public.v_product_availability",
          )
        ).rows,
    );
    const ids = staffRows.map((r) => r.product_id);
    expect(ids).toContain(activeProductId);
    expect(ids).toContain(draftProductId);
    expect(staffRows.every((r) => r.available_quantity !== null)).toBe(true);
  });
});

describe("Alergênicos (determinísticos)", () => {
  it("derivam dos ingredientes, inclusive de origem, e invalidam a validação", async () => {
    const leite = await one<{ id: string }>(
      "insert into public.ingredients (name) values ('Leite') returning id",
    );
    const manteiga = await one<{ id: string }>(
      "insert into public.ingredients (name, is_derived_from) values ('Manteiga', $1) returning id",
      [leite.id],
    );
    await db.query(
      "insert into public.ingredient_allergens select $1, id from public.allergens where code = 'leite'",
      [leite.id],
    );

    await as(db, { userId: OWNER }, () =>
      db.query("select public.validate_product_allergens($1)", [
        activeProductId,
      ]),
    );
    await db.query(
      "insert into public.product_ingredients (product_id, ingredient_id) values ($1, $2)",
      [activeProductId, manteiga.id],
    );

    const allergens = await db.query<{ code: string; presence: string }>(
      `select a.code, pa.presence from public.product_allergens pa
       join public.allergens a on a.id = pa.allergen_id where pa.product_id = $1`,
      [activeProductId],
    );
    expect(allergens.rows).toEqual([{ code: "leite", presence: "contains" }]);

    const product = await one<{ allergens_validated_at: string | null }>(
      "select allergens_validated_at from public.products where id = $1",
      [activeProductId],
    );
    expect(product.allergens_validated_at).toBeNull();
  });

  it("operação não valida ficha de alergênicos", async () => {
    await expect(
      as(db, { userId: OPERACAO }, () =>
        db.query("select public.validate_product_allergens($1)", [
          activeProductId,
        ]),
      ),
    ).rejects.toThrow(/owner\/admin/);
  });
});

describe("Regras de catálogo", () => {
  it("bloqueia 'orgânico' sem produtor certificado", async () => {
    await expect(
      db.query(
        `insert into public.products (slug, name, business_unit, sale_unit)
         values ('demo-alface', '[DEMO] Alface Orgânica', 'horta', 'maco')`,
      ),
    ).rejects.toThrow(/orgânico/);
  });

  it("visitante vê só dados públicos de produtores com produto ativo", async () => {
    const { id: comProduto } = await one<{ id: string }>(
      `insert into public.producers (name, kind, city, notes)
       values ('[DEMO] Sítio A', 'fornecedor', '[DEMO] Cidade', 'observação interna') returning id`,
    );
    await db.query(
      `insert into public.producers (name, kind, notes)
       values ('[DEMO] Sítio sem produto', 'fornecedor', 'observação interna')`,
    );
    await db.query(
      "update public.products set producer_id = $1 where id = $2",
      [comProduto, activeProductId],
    );

    await expect(
      as(db, { anon: true }, () => db.query("select * from public.producers")),
    ).rejects.toThrow(/permission denied/);

    const rows = await as(
      db,
      { anon: true },
      async () =>
        (
          await db.query<Record<string, unknown>>(
            "select * from public.v_public_producers",
          )
        ).rows,
    );
    expect(rows).toEqual([
      {
        id: comProduto,
        name: "[DEMO] Sítio A",
        kind: "fornecedor",
        city: "[DEMO] Cidade",
        organic_certified: false,
      },
    ]);
  });

  it("produto ativo exige preço (não inventamos preço)", async () => {
    await expect(
      db.query(
        `insert into public.products (slug, name, business_unit, category_id, sale_unit, status)
         values ('demo-sem-preco', '[DEMO] Sem preço', 'cozinha', $1, 'porcao', 'active')`,
        [categoryId],
      ),
    ).rejects.toThrow(/products_active_requires_price/);
  });

  it("auditoria registra quem alterou", async () => {
    await as(db, { userId: OWNER }, () =>
      db.query("update public.products set price_cents = 1200 where id = $1", [
        activeProductId,
      ]),
    );
    const log = await one<{
      actor_id: string;
      before: { price_cents: number };
      after: { price_cents: number };
    }>(
      `select actor_id, before, after from public.audit_log
       where table_name = 'products' and record_id = $1 and action = 'update'
       order by id desc limit 1`,
      [activeProductId],
    );
    expect(log.actor_id).toBe(OWNER);
    expect(log.before.price_cents).toBe(1000);
    expect(log.after.price_cents).toBe(1200);
  });
});
