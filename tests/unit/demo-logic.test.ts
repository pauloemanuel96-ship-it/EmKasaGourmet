import { describe, expect, it } from "vitest";
import {
  BOX_PLANS,
  DELIVERY_ZONES,
  INITIAL_STOCK,
  productBySlug,
} from "@/demo/data";
import {
  checkCompatibility,
  findProducts,
  interpret,
  nextDeliveryDates,
  planForPeople,
  suggestBox,
  type Member,
} from "@/demo/logic";

const semRestricao: Member = {
  id: "1",
  nickname: "Ana",
  allergies: [],
  diet: "sem_restricao",
  dislikes: [],
};

describe("compatibilidade (determinística)", () => {
  it("bloqueia 'pode conter' como 'contém'", () => {
    const lasanha = productBySlug("lasanha-vegana-berinjela")!;
    const c = checkCompatibility(lasanha, [
      { ...semRestricao, allergies: ["gluten"] },
    ]);
    expect(c).toMatchObject({
      ok: false,
      reason: "alergia",
      presence: "pode conter",
    });
  });

  it("produto com ficha em revisão não é liberado para quem tem alergia", () => {
    const bolo = productBySlug("bolo-cenoura-integral")!;
    expect(
      checkCompatibility(bolo, [{ ...semRestricao, allergies: ["soja"] }]),
    ).toMatchObject({
      ok: false,
      reason: "ficha_em_revisao",
    });
    expect(checkCompatibility(bolo, [semRestricao])).toEqual({ ok: true });
  });

  it("vegano atende quem é vegetariano", () => {
    const sopa = productBySlug("sopa-abobora-gengibre")!;
    expect(
      checkCompatibility(sopa, [{ ...semRestricao, diet: "vegetariano" }]),
    ).toEqual({ ok: true });
  });
});

describe("sugestão de BOX", () => {
  it("escolhe o plano pelo número de pessoas", () => {
    expect(planForPeople(1).code).toBe("solo");
    expect(planForPeople(3).code).toBe("familia");
    expect(planForPeople(6).code).toBe("familia_plus");
  });

  it("nunca inclui item esgotado ou de que alguém não gosta", () => {
    const s = suggestBox(
      BOX_PLANS[2],
      [{ ...semRestricao, dislikes: ["couve-manteiga"] }],
      INITIAL_STOCK,
    );
    const slugs = s.items.map((i) => i.slug);
    expect(slugs).not.toContain("rucula"); // estoque 0
    expect(slugs).not.toContain("couve-manteiga");
    expect(s.excluded.find((e) => e.slug === "rucula")?.why).toMatch(
      /Esgotado/,
    );
  });

  it("respeita o saldo disponível", () => {
    const s = suggestBox(BOX_PLANS[3], [semRestricao], {
      ...INITIAL_STOCK,
      "mamao-formosa": 1,
    });
    expect(s.items.find((i) => i.slug === "mamao-formosa")?.quantity).toBe(1);
  });
});

describe("datas de entrega", () => {
  it("só oferece dias da zona, respeitando bloqueios e prazo de corte", () => {
    const zonaB = DELIVERY_ZONES.find((z) => z.id === "zona-b")!; // qua e sáb
    const segunda = new Date(2026, 10, 16, 10, 0); // 16/11/2026, segunda
    const dates = nextDeliveryDates(zonaB, segunda, ["2026-11-18"], 3);
    expect(dates.map((d) => d.iso)).toEqual([
      "2026-11-21",
      "2026-11-25",
      "2026-11-28",
    ]);
    expect(dates[0].label).toBe("sábado, 21/11");
  });
});

describe("assistente operacional (regras)", () => {
  const hoje = new Date(2026, 10, 15, 9, 0);

  it("encontra produtos sem acento e no plural", () => {
    expect(findProducts("farofas nutritivas").map((p) => p.slug)).toEqual([
      "farofa-nutritiva",
    ]);
  });

  it("'Acabou o tomate' marca esgotado sem pedir confirmação", () => {
    expect(interpret("Acabou o tomate.", hoje)).toMatchObject({
      type: "proposal",
      needsConfirmation: false,
      proposal: { kind: "set_stock", slug: "tomate", quantity: 0 },
    });
  });

  it("'Chegaram mais 10 unidades de alface'", () => {
    expect(
      interpret("Chegaram mais 10 unidades de alface", hoje),
    ).toMatchObject({
      proposal: { kind: "add_stock", slug: "alface-crespa", quantity: 10 },
    });
  });

  it("'Temos oito Farofas Nutritivas' pede confirmação", () => {
    expect(interpret("Temos oito Farofas Nutritivas", hoje)).toMatchObject({
      needsConfirmation: true,
      proposal: { kind: "set_stock", slug: "farofa-nutritiva", quantity: 8 },
    });
  });

  it("'Amanhã não haverá entrega' bloqueia o dia seguinte", () => {
    expect(interpret("Amanhã não haverá entrega", hoje)).toMatchObject({
      proposal: { kind: "block_date", iso: "2026-11-16" },
    });
  });

  it("'Novo prato: lasanha vegana' cria rascunho", () => {
    expect(interpret("Novo prato: lasanha vegana", hoje)).toMatchObject({
      proposal: { kind: "draft_product", name: "lasanha vegana" },
    });
  });

  it("nome ambíguo pede escolha", () => {
    expect(interpret("Acabou o blend", hoje)).toMatchObject({
      type: "ambiguous",
    });
  });

  it("recusa mudança de preço pela conversa", () => {
    expect(interpret("muda o preço da farofa pra 25", hoje)).toMatchObject({
      type: "not_understood",
    });
  });
});
