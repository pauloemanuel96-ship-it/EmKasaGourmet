import { describe, expect, it } from "vitest";
import { menuFor } from "@/components/admin/admin-nav";
import {
  batchSchema,
  isBot,
  sourceLabel,
  toPeriod,
} from "@/modules/trafego/schemas";

const base = {
  visitor_id: "11111111-1111-4111-8111-111111111111",
  session_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  kind: "view",
  path: "/loja",
};

describe("registro de visitas", () => {
  it("aceita um lote válido e recusa tipo inventado, caminho externo e lote grande", () => {
    expect(batchSchema.safeParse({ events: [base] }).success).toBe(true);
    expect(
      batchSchema.safeParse({ events: [{ ...base, kind: "hack" }] }).success,
    ).toBe(false);
    expect(
      batchSchema.safeParse({ events: [{ ...base, path: "https://x.com" }] })
        .success,
    ).toBe(false);
    expect(
      batchSchema.safeParse({ events: Array.from({ length: 21 }, () => base) })
        .success,
    ).toBe(false);
  });

  it("robô e pré-visualização de link não contam", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("WhatsApp/2.23")).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari")).toBe(
      false,
    );
  });

  it("origem com nome amigável e período só entre os permitidos", () => {
    expect(sourceLabel("l.instagram.com")).toBe("Instagram");
    expect(sourceLabel("direto")).toMatch(/Direto/);
    expect(toPeriod("30")).toBe(30);
    expect(toPeriod("999")).toBe(7);
    expect(toPeriod(undefined)).toBe(7);
  });
});

describe("menu do painel por papel", () => {
  const hrefs = (role: Parameters<typeof menuFor>[0]) =>
    menuFor(role).map((i) => i.href);

  it("só o dono vê Tráfego", () => {
    expect(hrefs("owner")).toContain("/admin/trafego");
    expect(hrefs("admin")).not.toContain("/admin/trafego");
  });

  it("administração vê pedidos e ajustes; operação não vê clientes nem contatos", () => {
    expect(hrefs("admin")).toEqual(
      expect.arrayContaining([
        "/admin/pedidos",
        "/admin/clientes",
        "/admin/leads",
      ]),
    );
    expect(hrefs("operacao")).not.toContain("/admin/clientes");
    expect(hrefs("operacao")).not.toContain("/admin/leads");
    expect(hrefs(null)).toEqual([]);
  });
});
