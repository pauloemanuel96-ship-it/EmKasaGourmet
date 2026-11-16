import { describe, expect, it } from "vitest";
import { leadPopupMode } from "@/modules/leads/popup-config";
import { leadSchema, originLabel, parseOrigin } from "@/modules/leads/schemas";

describe("aviso de ofertas", () => {
  it("fala da Black Friday até o fim de 30/11 (horário de Brasília)", () => {
    expect(leadPopupMode(new Date("2026-11-16T12:00:00-03:00"))).toBe(
      "black-friday",
    );
    expect(leadPopupMode(new Date("2026-11-30T23:59:00-03:00"))).toBe(
      "black-friday",
    );
    expect(leadPopupMode(new Date("2026-12-01T00:00:01-03:00"))).toBe("geral");
  });
});

describe("cadastro de contato", () => {
  const ok = {
    name: " Maria ",
    email: " Maria@Exemplo.com ",
    phone: "(79) 99999-0000",
    consent: true,
    campaign: "geral",
  };
  it("limpa nome, e-mail e telefone", () => {
    expect(leadSchema.parse(ok)).toMatchObject({
      name: "Maria",
      email: "maria@exemplo.com",
      phone: "79999990000",
    });
  });
  it("telefone é opcional, mas se vier tem de ter DDD", () => {
    expect(leadSchema.safeParse({ ...ok, phone: "" }).success).toBe(true);
    expect(leadSchema.safeParse({ ...ok, phone: "99999" }).success).toBe(false);
  });
  it("exige o consentimento marcado", () => {
    expect(leadSchema.safeParse({ ...ok, consent: false }).success).toBe(false);
  });
});

describe("origem do visitante", () => {
  it("ignora campos desconhecidos e texto quebrado", () => {
    expect(parseOrigin('{"utm_source":"instagram","hack":"x"}')).toEqual({
      utm_source: "instagram",
    });
    expect(parseOrigin("{quebrado")).toEqual({});
  });
  it("resume a origem numa linha", () => {
    expect(originLabel({ gclid: "a" })).toBe("Google Ads");
    expect(originLabel({ utm_source: "instagram", utm_medium: "bio" })).toBe(
      "instagram · bio",
    );
    expect(originLabel({ referrer: "google.com" })).toBe("google.com");
    expect(originLabel({})).toBe("Direto");
  });
});
