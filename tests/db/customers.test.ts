import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { as, createTestDb, createUser } from "./harness";

const ANA = "00000000-0000-0000-0000-0000000000d1";
const BIA = "00000000-0000-0000-0000-0000000000d2";
const OWNER = "00000000-0000-0000-0000-0000000000d3";
const OPERACAO = "00000000-0000-0000-0000-0000000000d4";
let db: PGlite;

type Who = { userId: string } | { anon: true };
const run = (who: Who, sql: string, params: unknown[] = []) =>
  as(db, who, async () => (await db.query(sql, params)).rows);
const addAddress = (userId: string, label: string, isDefault = false) =>
  run(
    { userId },
    `insert into public.customer_addresses (label, cep, street, number, district, city, state, is_default)
     values ($1, '49000000', 'Rua A', '10', 'Centro', 'Aracaju', 'SE', $2) returning id, is_default`,
    [label, isDefault],
  );

beforeAll(async () => {
  db = await createTestDb();
  await createUser(db, ANA);
  await createUser(db, BIA);
  await createUser(db, OWNER, "owner");
  await createUser(db, OPERACAO, "operacao");
  for (const id of [ANA, BIA]) {
    await run(
      { userId: id },
      "insert into public.customers (id, name, email) values ($1, 'Cliente Teste', 'falso@invasor.com')",
      [id],
    );
  }
});

describe("conta do cliente", () => {
  it("o e-mail vem do login, não do que o navegador manda", async () => {
    const rows = await run(
      { userId: ANA },
      "select email from public.customers",
    );
    expect(rows).toHaveLength(1);
    expect((rows[0] as { email: string }).email).not.toBe("falso@invasor.com");
  });

  it("ninguém cria conta em nome de outra pessoa", async () => {
    await expect(
      run(
        { userId: ANA },
        "insert into public.customers (id, name, email) values ($1, 'Outra', 'x@y.com')",
        [OWNER],
      ),
    ).rejects.toThrow();
  });

  it("cada pessoa vê só a própria conta; a administração vê todas; a operação não", async () => {
    expect(
      await run({ userId: ANA }, "select id from public.customers"),
    ).toEqual([{ id: ANA }]);
    expect(
      await run({ userId: OWNER }, "select id from public.customers"),
    ).toHaveLength(2);
    expect(
      await run({ userId: OPERACAO }, "select id from public.customers"),
    ).toHaveLength(0);
    await expect(
      run({ anon: true }, "select id from public.customers"),
    ).rejects.toThrow();
  });

  it("a pessoa altera os próprios dados, mas não o e-mail nem a conta de outra", async () => {
    await run(
      { userId: ANA },
      "update public.customers set name = 'Ana Maria' where id = $1",
      [ANA],
    );
    await expect(
      run(
        { userId: ANA },
        "update public.customers set email = 'troca@x.com' where id = $1",
        [ANA],
      ),
    ).rejects.toThrow();
    await run(
      { userId: ANA },
      "update public.customers set name = 'Invadida' where id = $1",
      [BIA],
    );
    const bia = await run({ userId: BIA }, "select name from public.customers");
    expect(bia).toEqual([{ name: "Cliente Teste" }]);
  });
});

describe("endereços da conta", () => {
  it("o primeiro endereço vira o principal sozinho", async () => {
    const [casa] = (await addAddress(ANA, "Casa")) as { is_default: boolean }[];
    expect(casa.is_default).toBe(true);
  });

  it("marcar outro como principal desmarca o anterior", async () => {
    await addAddress(ANA, "Trabalho", true);
    const rows = await run(
      { userId: ANA },
      "select label from public.customer_addresses where is_default",
    );
    expect(rows).toEqual([{ label: "Trabalho" }]);
  });

  it("apagar o principal promove outro", async () => {
    await run(
      { userId: ANA },
      "delete from public.customer_addresses where label = 'Trabalho'",
    );
    const rows = await run(
      { userId: ANA },
      "select label, is_default from public.customer_addresses",
    );
    expect(rows).toEqual([{ label: "Casa", is_default: true }]);
  });

  it("uma pessoa não lê, altera nem apaga endereço de outra", async () => {
    expect(
      await run({ userId: BIA }, "select id from public.customer_addresses"),
    ).toHaveLength(0);
    await run(
      { userId: BIA },
      "update public.customer_addresses set street = 'Invadida'",
    );
    await run({ userId: BIA }, "delete from public.customer_addresses");
    const rows = await run(
      { userId: ANA },
      "select street from public.customer_addresses",
    );
    expect(rows).toEqual([{ street: "Rua A" }]);
    await expect(
      run(
        { userId: BIA },
        `insert into public.customer_addresses (customer_id, label, cep, street, number, district, city, state)
         values ($1, 'X', '49000000', 'R', '1', 'B', 'C', 'SE')`,
        [ANA],
      ),
    ).rejects.toThrow();
  });

  it("a administração lê os endereços; a operação e o visitante não", async () => {
    expect(
      await run({ userId: OWNER }, "select id from public.customer_addresses"),
    ).toHaveLength(1);
    expect(
      await run(
        { userId: OPERACAO },
        "select id from public.customer_addresses",
      ),
    ).toHaveLength(0);
    await expect(
      run({ anon: true }, "select id from public.customer_addresses"),
    ).rejects.toThrow();
  });

  it("limita a 10 endereços por conta e recusa CEP inválido", async () => {
    for (let i = 0; i < 9; i++) await addAddress(ANA, `Extra ${i}`);
    await expect(addAddress(ANA, "Onze")).rejects.toThrow(/Limite/);
    await expect(
      run(
        { userId: BIA },
        `insert into public.customer_addresses (label, cep, street, number, district, city, state)
         values ('Casa', '123', 'R', '1', 'B', 'C', 'SE')`,
      ),
    ).rejects.toThrow();
  });
});
