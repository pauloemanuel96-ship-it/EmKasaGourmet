import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { as, createTestDb, createUser } from "./harness";

const OWNER = "00000000-0000-0000-0000-0000000000e1";
const OPER = "00000000-0000-0000-0000-0000000000e2";
const CLIENT = "00000000-0000-0000-0000-0000000000e3";
let db: PGlite;

type Who = { userId: string } | { anon: true };
const run = (who: Who, sql: string, params: unknown[] = []) =>
  as(db, who, async () => (await db.query(sql, params)).rows);

const ask = (
  who: Who,
  over: Partial<{
    phone: string;
    restrictions: string | null;
    consent: boolean;
    date: string | null;
  }> = {},
) =>
  run(
    who,
    `select public.request_chef($1, $2::date, $3, $4, $5, $6, $7, $8, $9, $10, $11) as id`,
    [
      "ocasiao",
      over.date ?? null,
      "jantar",
      "Jardins",
      4,
      "Aniversário de casamento",
      over.restrictions ?? null,
      over.consent ?? false,
      "Maria Souza",
      over.phone ?? "(79) 99999-0000",
      null,
    ],
  );

beforeAll(async () => {
  db = await createTestDb();
  await createUser(db, OWNER, "owner");
  await createUser(db, OPER, "operacao");
  await createUser(db, CLIENT);
});

describe("Chef Emkasa: pedidos de proposta", () => {
  it("visitante pede proposta, mas não lê pedido nenhum", async () => {
    const [{ id }] = (await ask({ anon: true })) as { id: string }[];
    expect(id).toMatch(/[0-9a-f-]{36}/);
    await expect(
      run({ anon: true }, "select * from public.chef_requests"),
    ).rejects.toThrow(/permission/i);
  });

  it("restrição de saúde sem autorização é recusada; com autorização, grava a hora", async () => {
    await expect(
      ask(
        { anon: true },
        { phone: "79988887777", restrictions: "Alergia a amendoim" },
      ),
    ).rejects.toThrow(/autorizar/i);
    await ask(
      { anon: true },
      {
        phone: "79988887777",
        restrictions: "Alergia a amendoim",
        consent: true,
      },
    );
    const [row] = (await run(
      { userId: OWNER },
      "select restrictions, restrictions_consent_at from public.chef_requests where phone = '79988887777'",
    )) as { restrictions: string; restrictions_consent_at: string | null }[];
    expect(row.restrictions).toBe("Alergia a amendoim");
    expect(row.restrictions_consent_at).not.toBeNull();
  });

  it("data no passado é recusada", async () => {
    await expect(
      ask({ anon: true }, { phone: "79911112222", date: "2020-01-01" }),
    ).rejects.toThrow(/hoje ou depois/i);
  });

  it("mais de 3 pedidos abertos pelo mesmo telefone são recusados", async () => {
    for (let i = 0; i < 3; i++)
      await ask({ anon: true }, { phone: "79933334444" });
    await expect(ask({ anon: true }, { phone: "79933334444" })).rejects.toThrow(
      /já recebemos/i,
    );
  });

  it("logado: o pedido fica ligado à conta e a pessoa vê só os seus", async () => {
    await ask({ userId: CLIENT }, { phone: "79955556666" });
    const mine = (await run(
      { userId: CLIENT },
      "select user_id from public.chef_requests",
    )) as { user_id: string }[];
    expect(mine).toHaveLength(1);
    expect(mine[0].user_id).toBe(CLIENT);
  });

  it("dono muda o andamento; operação não vê os pedidos", async () => {
    await run(
      { userId: OWNER },
      "update public.chef_requests set status = 'em_conversa' where phone = '79955556666'",
    );
    const [r] = (await run(
      { userId: OWNER },
      "select status from public.chef_requests where phone = '79955556666'",
    )) as { status: string }[];
    expect(r.status).toBe("em_conversa");
    expect(
      await run({ userId: OPER }, "select * from public.chef_requests"),
    ).toHaveLength(0);
  });
});
