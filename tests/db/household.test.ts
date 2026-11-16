import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { as, createTestDb, createUser } from "./harness";

const ANA = "00000000-0000-0000-0000-0000000000e1";
const BIA = "00000000-0000-0000-0000-0000000000e2";
const OWNER = "00000000-0000-0000-0000-0000000000e3";
const TEXT =
  "Autorizo a Emkasa a guardar alergias, dieta e objetivos das pessoas da minha casa.";
let db: PGlite;

type Who = { userId: string } | { anon: true };
const run = (who: Who, sql: string, params: unknown[] = []) =>
  as(db, who, async () => (await db.query(sql, params)).rows);
const consent = (userId: string) =>
  run(
    { userId },
    "insert into public.consents (kind, consent_text) values ('health_profile', $1)",
    [TEXT],
  );

beforeAll(async () => {
  db = await createTestDb();
  await createUser(db, ANA);
  await createUser(db, BIA);
  await createUser(db, OWNER, "owner");
  for (const id of [ANA, BIA, OWNER]) {
    await run(
      { userId: id },
      "insert into public.customers (id, name, email) values ($1, 'Cliente', 'x@x.com')",
      [id],
    );
  }
});

describe("família da conta", () => {
  it("pessoa sem dado de saúde entra sem consentimento", async () => {
    await run(
      { userId: ANA },
      "insert into public.household_members (name, relation, likes, dislikes) values ('Léo', 'filho', '{banana}', '{jiló}')",
    );
    expect(
      await run({ userId: ANA }, "select name from public.household_members"),
    ).toEqual([{ name: "Léo" }]);
  });

  it("alergia, dieta ou objetivo exigem consentimento registrado", async () => {
    for (const set of [
      "allergies = '{leite}'",
      "diet = 'vegano'",
      "goal = 'comer mais verduras'",
    ]) {
      await expect(
        run({ userId: ANA }, `update public.household_members set ${set}`),
      ).rejects.toThrow(/consentimento/);
    }
    await consent(ANA);
    await run(
      { userId: ANA },
      "update public.household_members set allergies = '{leite,soja}', diet = 'vegetariano'",
    );
    const rows = await run(
      { userId: ANA },
      "select allergies, diet from public.household_members",
    );
    expect(rows).toEqual([
      { allergies: ["leite", "soja"], diet: "vegetariano" },
    ]);
  });

  it("recusa alergênico que não existe na lista oficial", async () => {
    await expect(
      run(
        { userId: ANA },
        "update public.household_members set allergies = '{kriptonita}'",
      ),
    ).rejects.toThrow(/desconhecido/);
  });

  it("só o dono lê: outra cliente, a administração e o visitante não veem nada", async () => {
    expect(
      await run({ userId: BIA }, "select id from public.household_members"),
    ).toHaveLength(0);
    expect(
      await run({ userId: OWNER }, "select id from public.household_members"),
    ).toHaveLength(0);
    expect(
      await run({ userId: OWNER }, "select id from public.consents"),
    ).toHaveLength(0);
    await expect(
      run({ anon: true }, "select id from public.household_members"),
    ).rejects.toThrow();
  });

  it("ninguém cadastra, altera ou apaga pessoa na conta de outra", async () => {
    await expect(
      run(
        { userId: BIA },
        "insert into public.household_members (customer_id, name) values ($1, 'Intrusa')",
        [ANA],
      ),
    ).rejects.toThrow();
    await run(
      { userId: BIA },
      "update public.household_members set name = 'Trocado'",
    );
    await run({ userId: BIA }, "delete from public.household_members");
    expect(
      await run({ userId: ANA }, "select name from public.household_members"),
    ).toEqual([{ name: "Léo" }]);
  });

  it("retirar o consentimento apaga os dados de saúde e mantém a pessoa", async () => {
    await run({ userId: ANA }, "select public.revoke_health_consent()");
    const rows = await run(
      { userId: ANA },
      "select name, allergies, diet, goal, dislikes from public.household_members",
    );
    expect(rows).toEqual([
      {
        name: "Léo",
        allergies: [],
        diet: "sem_restricao",
        goal: null,
        dislikes: ["jiló"],
      },
    ]);
    await expect(
      run(
        { userId: ANA },
        "update public.household_members set diet = 'vegano'",
      ),
    ).rejects.toThrow(/consentimento/);
  });

  it("o consentimento de uma conta não vale para outra", async () => {
    await consent(BIA);
    await expect(
      run(
        { userId: ANA },
        "update public.household_members set diet = 'vegano'",
      ),
    ).rejects.toThrow(/consentimento/);
  });

  it("limita a 12 pessoas por conta", async () => {
    for (let i = 0; i < 11; i++) {
      await run(
        { userId: ANA },
        "insert into public.household_members (name) values ($1)",
        [`Pessoa ${i}`],
      );
    }
    await expect(
      run(
        { userId: ANA },
        "insert into public.household_members (name) values ('Treze')",
      ),
    ).rejects.toThrow(/Limite/);
  });
});
