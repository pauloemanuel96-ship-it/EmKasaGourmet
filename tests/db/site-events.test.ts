import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { as, createTestDb, createUser } from "./harness";

const OWNER = "00000000-0000-0000-0000-0000000000d1";
const ADMIN = "00000000-0000-0000-0000-0000000000d2";
const CLIENT = "00000000-0000-0000-0000-0000000000d3";
const V1 = "11111111-1111-4111-8111-111111111111";
const V2 = "22222222-2222-4222-8222-222222222222";
const S1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const S2 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
let db: PGlite;

type Who = { userId: string } | { anon: true };
const run = (who: Who, sql: string, params: unknown[] = []) =>
  as(db, who, async () => (await db.query(sql, params)).rows);
const track = (who: Who, events: object[]) =>
  run(who, "select public.track_events($1::jsonb) as n", [
    JSON.stringify(events),
  ]);
const ev = (session: string, visitor: string, kind: string, extra = {}) => ({
  visitor_id: visitor,
  session_id: session,
  kind,
  path: "/",
  device: "celular",
  ...extra,
});

beforeAll(async () => {
  db = await createTestDb();
  await createUser(db, OWNER, "owner");
  await createUser(db, ADMIN, "admin");
  await createUser(db, CLIENT);
});

describe("registro de visitas (site_events)", () => {
  it("visitante grava eventos, mas não consegue ler nada", async () => {
    const [{ n }] = (await track({ anon: true }, [
      ev(S1, V1, "view", { source: "instagram", medium: "bio" }),
      ev(S1, V1, "view", { path: "/produto/farofa" }),
      ev(S1, V1, "add_to_cart", {
        path: "/produto/farofa",
        product_slug: "farofa",
        quantity: 2,
      }),
      ev(S1, V1, "inventado"),
    ])) as { n: number }[];
    expect(n).toBe(3);
    await expect(
      run({ anon: true }, "select * from public.site_events"),
    ).rejects.toThrow(/permission/i);
  });

  it("a hora e a pessoa logada vêm do banco", async () => {
    await track({ userId: CLIENT }, [
      ev(S2, V2, "view", { path: "/checkout" }),
      ev(S2, V2, "order_placed", { path: "/checkout" }),
    ]);
    const rows = (await run(
      { userId: OWNER },
      "select user_id from public.site_events where session_id = $1",
      [S2],
    )) as { user_id: string }[];
    expect(rows.every((r) => r.user_id === CLIENT)).toBe(true);
  });

  it("lote acima de 20 eventos é recusado", async () => {
    await expect(
      track(
        { anon: true },
        Array.from({ length: 21 }, () => ev(S1, V1, "view")),
      ),
    ).rejects.toThrow(/grande/i);
  });

  it("só o dono lê: administração e cliente não veem", async () => {
    expect(
      await run({ userId: ADMIN }, "select * from public.site_events"),
    ).toHaveLength(0);
    expect(
      await run({ userId: CLIENT }, "select * from public.site_events"),
    ).toHaveLength(0);
    await expect(
      run({ userId: ADMIN }, "select public.traffic_report(7)"),
    ).rejects.toThrow(/dono/i);
  });

  it("relatório do dono: totais, funil, origem e produtos", async () => {
    const [{ r }] = (await run(
      { userId: OWNER },
      "select public.traffic_report(7) as r",
    )) as { r: Record<string, unknown> }[];
    const report = r as {
      totals: {
        visitors: number;
        sessions: number;
        views: number;
        orders: number;
      };
      funnel: { step: string; sessions: number }[];
      sources: { source: string; sessions: number }[];
      products: { slug: string; added: number }[];
      daily: unknown[];
      recent: { reached: string }[];
    };
    expect(report.totals).toMatchObject({
      visitors: 2,
      sessions: 2,
      views: 3,
      orders: 1,
    });
    expect(report.funnel.map((f) => f.sessions)).toEqual([2, 1, 1, 1, 1]);
    expect(report.sources.map((s) => s.source).sort()).toEqual([
      "direto",
      "instagram",
    ]);
    expect(report.products[0]).toMatchObject({ slug: "farofa", added: 2 });
    expect(report.daily).toHaveLength(7);
    expect(report.recent.map((x) => x.reached).sort()).toEqual([
      "Fez o pedido",
      "Pôs no carrinho",
    ]);
  });
});
