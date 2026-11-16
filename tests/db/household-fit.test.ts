import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { as, createTestDb, createUser } from "./harness";

const ANA = "00000000-0000-0000-0000-0000000000f1";
const BIA = "00000000-0000-0000-0000-0000000000f2";
const OWNER = "00000000-0000-0000-0000-0000000000f3";
const TEXT =
  "Autorizo a Emkasa a guardar alergias, dieta e objetivos das pessoas da minha casa.";
let db: PGlite;
let categoryId: string;

type Row = {
  product_slug: string;
  member_name: string;
  verdict: string;
  reasons: string[];
};
const fit = (userId: string) =>
  as(
    db,
    { userId },
    async () =>
      (
        await db.query<Row>(
          "select * from public.household_fit() order by product_slug, member_name",
        )
      ).rows,
  );
const sql = async (q: string, params: unknown[] = []) =>
  (await db.query<{ id: string }>(q, params)).rows;

async function product(
  slug: string,
  allergens: [string, "contains" | "may_contain"][],
  validated: boolean,
  diet?: string,
) {
  const [{ id }] = await sql(
    "insert into public.products (slug, name, business_unit, category_id, sale_unit, price_cents) values ($1, $2, 'cozinha', $3, 'porcao', 1000) returning id",
    [slug, `[DEMO] ${slug}`, categoryId],
  );
  for (const [code, presence] of allergens) {
    await sql(
      `insert into public.product_allergens (product_id, allergen_id, presence, source)
       select $1, a.id, $2::public.allergen_presence, $3::public.allergen_source from public.allergens a where a.code = $4`,
      [
        id,
        presence,
        presence === "contains" ? "manual" : "cross_contamination",
        code,
      ],
    );
  }
  if (diet) {
    await sql(
      `insert into public.product_diet_labels (product_id, label_id, approved_by, approved_at)
       select $1, l.id, $2, now() from public.diet_labels l where l.code = $3`,
      [id, OWNER, diet],
    );
  }
  await sql(
    "update public.products set status = 'active', allergens_validated_at = $2, allergens_validated_by = $3 where id = $1",
    [id, validated ? new Date().toISOString() : null, validated ? OWNER : null],
  );
}

beforeAll(async () => {
  db = await createTestDb();
  await createUser(db, ANA);
  await createUser(db, BIA);
  await createUser(db, OWNER, "owner");
  [{ id: categoryId }] = await sql(
    "insert into public.categories (name, slug, business_unit) values ('[DEMO] Cozinha', 'demo-cozinha', 'cozinha') returning id",
  );
  await db.exec("alter table public.products disable trigger user");
  await product("pao", [["trigo", "contains"]], true);
  await product("bolo", [["leite", "may_contain"]], true);
  await product("salada", [], true, "vegano");
  await product("molho", [], false);
  await db.exec("alter table public.products enable trigger user");
  for (const id of [ANA, BIA]) {
    await as(db, { userId: id }, async () => {
      await db.query(
        "insert into public.customers (id, name, email) values ($1, 'Cliente', 'x@x.com')",
        [id],
      );
      await db.query(
        "insert into public.consents (kind, consent_text) values ('health_profile', $1)",
        [TEXT],
      );
    });
  }
  await as(db, { userId: ANA }, async () => {
    await db.query(
      "insert into public.household_members (name, allergies) values ('Léo', '{gluten,leite}')",
    );
    await db.query(
      "insert into public.household_members (name, diet) values ('Maria', 'vegetariano')",
    );
    await db.query("insert into public.household_members (name) values ('Zé')");
  });
}, 60_000);

describe("serve para a minha casa?", () => {
  it("glúten bloqueia trigo, e 'pode conter' bloqueia igual a 'contém'", async () => {
    const rows = await fit(ANA);
    expect(rows).toContainEqual(
      expect.objectContaining({
        product_slug: "pao",
        member_name: "Léo",
        verdict: "blocked",
        reasons: ["contém trigo"],
      }),
    );
    const bolo = rows.find(
      (r) => r.product_slug === "bolo" && r.member_name === "Léo",
    );
    expect(bolo?.verdict).toBe("blocked");
    expect(bolo?.reasons[0]).toMatch(/^pode conter leite/);
  });

  it("ficha não validada vira dúvida para quem tem restrição, nunca 'serve'", async () => {
    const rows = await fit(ANA);
    expect(rows).toContainEqual(
      expect.objectContaining({
        product_slug: "molho",
        member_name: "Léo",
        verdict: "unknown",
      }),
    );
  });

  it("dieta só é confirmada por selo aprovado; vegano serve para vegetariana", async () => {
    const maria = (await fit(ANA)).filter((r) => r.member_name === "Maria");
    expect(maria.map((r) => r.product_slug)).toEqual(["bolo", "molho", "pao"]);
    expect(maria.every((r) => r.verdict === "diet")).toBe(true);
  });

  it("quem não tem restrição não aparece: tudo serve", async () => {
    expect((await fit(ANA)).some((r) => r.member_name === "Zé")).toBe(false);
  });

  it("cada conta só enxerga a própria família", async () => {
    expect(await fit(BIA)).toHaveLength(0);
    await expect(
      as(db, { anon: true }, () =>
        db.query("select * from public.household_fit()"),
      ),
    ).rejects.toThrow();
  });
});
