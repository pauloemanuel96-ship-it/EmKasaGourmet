import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { as, createTestDb, createUser } from "./harness";

const OWNER = "00000000-0000-0000-0000-0000000000c1";
const OPERACAO = "00000000-0000-0000-0000-0000000000c2";
const TEXT = "Aceito receber ofertas e novidades da Emkasa.";
let db: PGlite;

type Who = { userId: string } | { anon: true };
const run = (who: Who, sql: string, params: unknown[] = []) =>
  as(db, who, async () => (await db.query(sql, params)).rows);
const capture = (who: Who, email: string, consent: boolean, origin = "{}") =>
  run(who, "select public.capture_lead($1, $2, $3, $4, $5, $6, $7::jsonb)", [
    "Maria Teste",
    email,
    "(79) 99999-0000",
    "black-friday",
    consent,
    TEXT,
    origin,
  ]);

beforeAll(async () => {
  db = await createTestDb();
  await createUser(db, OWNER, "owner");
  await createUser(db, OPERACAO, "operacao");
});

describe("contatos captados (leads)", () => {
  it("visitante se cadastra com consentimento e a origem fica gravada", async () => {
    await capture(
      { anon: true },
      "Maria@Exemplo.com",
      true,
      JSON.stringify({
        utm_source: "instagram",
        utm_medium: "bio",
        gclid: "abc",
      }),
    );
    const rows = await run({ userId: OWNER }, "select * from public.leads");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      email: "maria@exemplo.com",
      phone: "79999990000",
      campaign: "black-friday",
      consent_marketing: true,
      utm_source: "instagram",
      gclid: "abc",
    });
  });

  it("sem consentimento não grava nada", async () => {
    await expect(
      capture({ anon: true }, "sem@exemplo.com", false),
    ).rejects.toThrow(/aceitar/i);
    const rows = await run(
      { userId: OWNER },
      "select 1 from public.leads where email = 'sem@exemplo.com'",
    );
    expect(rows).toHaveLength(0);
  });

  it("e-mail inválido é recusado", async () => {
    await expect(capture({ anon: true }, "nao-e-email", true)).rejects.toThrow(
      /inv[aá]lido/i,
    );
  });

  it("o mesmo e-mail atualiza o cadastro e mantém a primeira origem", async () => {
    await capture(
      { anon: true },
      "MARIA@exemplo.com",
      true,
      JSON.stringify({ utm_source: "google" }),
    );
    const rows = await run(
      { userId: OWNER },
      "select utm_source from public.leads",
    );
    expect(rows).toEqual([{ utm_source: "instagram" }]);
  });

  it("visitante não lê nem insere direto na tabela", async () => {
    await expect(
      run({ anon: true }, "select * from public.leads"),
    ).rejects.toThrow();
    await expect(
      run(
        { anon: true },
        "insert into public.leads (name, email, consent_marketing, consent_text) values ('X Y', 'x@y.com', true, $1)",
        [TEXT],
      ),
    ).rejects.toThrow();
  });

  it("operação não vê os contatos; administração vê e apaga", async () => {
    expect(
      await run({ userId: OPERACAO }, "select * from public.leads"),
    ).toHaveLength(0);
    await run({ userId: OWNER }, "delete from public.leads");
    expect(
      await run({ userId: OWNER }, "select * from public.leads"),
    ).toHaveLength(0);
    const audit = await db.query(
      "select 1 from public.audit_log where table_name = 'leads' and action = 'delete'",
    );
    expect(audit.rows.length).toBeGreaterThan(0);
  });
});
