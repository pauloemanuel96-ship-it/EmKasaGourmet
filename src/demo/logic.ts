/**
 * Regras do protótipo. Funções puras (sem estado), testadas em tests/unit/demo-logic.test.ts.
 * As mesmas regras irão para o banco/servidor quando cada módulo ficar real.
 */
import {
  BOX_PLANS,
  PRODUCTS,
  type AllergenCode,
  type BoxPlan,
  type DeliveryZone,
  type DietLabel,
  type Product,
} from "./data";

// ---------------------------------------------------------------------------
// Compatibilidade com a casa (determinística: nunca IA)
// ---------------------------------------------------------------------------
export type Member = {
  id: string;
  nickname: string;
  allergies: AllergenCode[];
  diet: DietLabel | "sem_restricao";
  dislikes: string[]; // slugs de produtos
};

export type Compatibility =
  | { ok: true }
  | {
      ok: false;
      reason: "alergia";
      member: string;
      allergen: AllergenCode;
      presence: "contém" | "pode conter";
    }
  | { ok: false; reason: "ficha_em_revisao" }
  | { ok: false; reason: "dieta"; member: string; diet: DietLabel };

export function checkCompatibility(
  product: Product,
  members: Member[],
): Compatibility {
  const anyAllergy = members.some((m) => m.allergies.length > 0);
  if (anyAllergy && !product.allergensValidated) {
    return { ok: false, reason: "ficha_em_revisao" };
  }
  for (const m of members) {
    for (const a of m.allergies) {
      if (product.contains.includes(a)) {
        return {
          ok: false,
          reason: "alergia",
          member: m.nickname,
          allergen: a,
          presence: "contém",
        };
      }
      if (product.mayContain.includes(a)) {
        return {
          ok: false,
          reason: "alergia",
          member: m.nickname,
          allergen: a,
          presence: "pode conter",
        };
      }
    }
    if (m.diet !== "sem_restricao" && !product.diet.includes(m.diet)) {
      // vegano satisfaz vegetariano
      const veganCoversVegetarian =
        m.diet === "vegetariano" && product.diet.includes("vegano");
      if (!veganCoversVegetarian)
        return { ok: false, reason: "dieta", member: m.nickname, diet: m.diet };
    }
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Sugestão de BOX: cruza plano × perfil da casa × estoque real
// ---------------------------------------------------------------------------
export type BoxItem = { slug: string; quantity: number };
export type BoxSuggestion = {
  plan: BoxPlan;
  items: BoxItem[];
  missing: { group: string; wanted: number; got: number }[];
  excluded: { slug: string; why: string }[];
};

export function planForPeople(people: number): BoxPlan {
  if (people <= 1) return BOX_PLANS[0];
  if (people === 2) return BOX_PLANS[1];
  if (people <= 4) return BOX_PLANS[2];
  return BOX_PLANS[3];
}

export function suggestBox(
  plan: BoxPlan,
  members: Member[],
  stock: Record<string, number>,
  reserved: Record<string, number> = {},
): BoxSuggestion {
  const dislikes = new Set(members.flatMap((m) => m.dislikes));
  const excluded: BoxSuggestion["excluded"] = [];
  const items: BoxItem[] = [];
  const missing: BoxSuggestion["missing"] = [];

  for (const [group, wanted] of Object.entries(plan.groups)) {
    const candidates = PRODUCTS.filter(
      (p) => p.unit === "horta" && p.boxGroup === group,
    );
    let got = 0;
    for (const p of candidates) {
      if (got >= wanted) break;
      const available = (stock[p.slug] ?? 0) - (reserved[p.slug] ?? 0);
      if (dislikes.has(p.slug)) {
        excluded.push({ slug: p.slug, why: "Alguém da casa não gosta" });
        continue;
      }
      const c = checkCompatibility(p, members);
      if (!c.ok) {
        excluded.push({ slug: p.slug, why: describeIncompatibility(c) });
        continue;
      }
      if (available <= 0) {
        excluded.push({ slug: p.slug, why: "Esgotado esta semana" });
        continue;
      }
      const qty = Math.min(wanted - got, available, 2);
      items.push({ slug: p.slug, quantity: qty });
      got += qty;
    }
    if (got < wanted) missing.push({ group, wanted, got });
  }
  return { plan, items, missing, excluded };
}

export function describeIncompatibility(
  c: Exclude<Compatibility, { ok: true }>,
): string {
  switch (c.reason) {
    case "ficha_em_revisao":
      return "Ficha de alergênicos em revisão";
    case "alergia":
      return `${c.presence === "contém" ? "Contém" : "Pode conter"} alergênico declarado por ${c.member}`;
    case "dieta":
      return `Não atende à alimentação de ${c.member}`;
  }
}

// ---------------------------------------------------------------------------
// Entregas
// ---------------------------------------------------------------------------
const WEEKDAY = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];

export function nextDeliveryDates(
  zone: DeliveryZone,
  from: Date,
  blocked: string[] = [],
  count = 4,
  cutoffHours = 24,
): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = [];
  const earliest = new Date(from.getTime() + cutoffHours * 3600_000);
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  for (let i = 0; i < 30 && out.length < count; i++) {
    d.setDate(d.getDate() + 1);
    const iso = toIsoDate(d);
    if (
      d < earliest ||
      !zone.weekdays.includes(d.getDay()) ||
      blocked.includes(iso)
    )
      continue;
    out.push({
      iso,
      label: `${WEEKDAY[d.getDay()]}, ${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`,
    });
  }
  return out;
}

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Assistente operacional (protótipo por regras; a IA entra na Fase 3)
// Fluxo: mensagem → intenção → produto → proposta → confirmação → execução
// ---------------------------------------------------------------------------
export type AssistantProposal =
  | { kind: "set_stock"; slug: string; quantity: number; summary: string }
  | { kind: "add_stock"; slug: string; quantity: number; summary: string }
  | { kind: "set_available_list"; slugs: string[]; summary: string }
  | { kind: "block_date"; iso: string; summary: string }
  | { kind: "draft_product"; name: string; summary: string };

export type AssistantResult =
  | {
      type: "proposal";
      proposal: AssistantProposal;
      needsConfirmation: boolean;
    }
  | { type: "ambiguous"; message: string; options: string[] }
  | { type: "not_understood"; message: string };

const NUMBER_WORDS: Record<string, number> = {
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  três: 3,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  quinze: 15,
  vinte: 20,
};

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

function parseNumber(token: string): number | null {
  const n = Number(token.replace(",", "."));
  if (Number.isFinite(n)) return n;
  return NUMBER_WORDS[norm(token)] ?? NUMBER_WORDS[token.toLowerCase()] ?? null;
}

/** Encontra produtos cujo nome contém o termo (sem acento, singular simples). */
export function findProducts(term: string): Product[] {
  const t = norm(term)
    .replace(/s\b/g, "")
    .replace(/\b(de|da|do|as|os|a|o|mais|unidades?)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return [];
  const words = t.split(" ").filter((w) => w.length > 2);
  return PRODUCTS.filter((p) => {
    const name = norm(p.name).replace(/s\b/g, "");
    return words.every((w) => name.includes(w));
  });
}

function single(term: string): { product?: Product; result?: AssistantResult } {
  const found = findProducts(term);
  if (found.length === 1) return { product: found[0] };
  if (found.length === 0) {
    return {
      result: {
        type: "not_understood",
        message: `Não encontrei "${term.trim()}" no catálogo. Quer cadastrar como novo produto?`,
      },
    };
  }
  return {
    result: {
      type: "ambiguous",
      message: `Encontrei mais de um produto para "${term.trim()}". Qual deles?`,
      options: found.map((p) => p.name),
    },
  };
}

export function interpret(message: string, today: Date): AssistantResult {
  const raw = message.trim().replace(/[.!]+$/, "");
  const m = norm(raw);

  // "Amanhã não haverá entrega"
  if (/amanha/.test(m) && /(nao|sem).*(entrega)/.test(m)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    const iso = toIsoDate(d);
    return {
      type: "proposal",
      needsConfirmation: true,
      proposal: {
        kind: "block_date",
        iso,
        summary: `Bloquear entregas de amanhã (${iso.split("-").reverse().join("/")}).`,
      },
    };
  }

  // "Novo prato: lasanha vegana"
  const novo = raw.match(/^nov[oa]\s+(?:prato|produto)\s*:?\s*(.+)$/i);
  if (novo) {
    const name = novo[1].trim();
    return {
      type: "proposal",
      needsConfirmation: true,
      proposal: {
        kind: "draft_product",
        name,
        summary: `Criar rascunho "${name}" (sem preço e sem alergênicos; complete a ficha antes de publicar).`,
      },
    };
  }

  // "Acabou o tomate" / "acabaram as alfaces"
  const acabou = m.match(/^acab(?:ou|aram)\s+(.+)$/);
  if (acabou) {
    const s = single(acabou[1]);
    if (!s.product) return s.result!;
    return {
      type: "proposal",
      needsConfirmation: false,
      proposal: {
        kind: "set_stock",
        slug: s.product.slug,
        quantity: 0,
        summary: `Marcar ${s.product.name} como esgotado (estoque 0).`,
      },
    };
  }

  // "Chegaram mais 10 unidades de alface" / "chegou 5 kg de cenoura"
  const chegou = m.match(
    /^cheg(?:ou|aram)\s+(?:mais\s+)?(\S+)\s+(?:kg\s+|unidades?\s+|macos?\s+|potes?\s+)?(?:de\s+)?(.+)$/,
  );
  if (chegou) {
    const qty = parseNumber(chegou[1]);
    if (qty === null || qty <= 0)
      return {
        type: "not_understood",
        message: 'Não entendi a quantidade. Ex.: "Chegaram 10 alfaces".',
      };
    const s = single(chegou[2]);
    if (!s.product) return s.result!;
    return {
      type: "proposal",
      needsConfirmation: false,
      proposal: {
        kind: "add_stock",
        slug: s.product.slug,
        quantity: qty,
        summary: `Somar ${qty} ao estoque de ${s.product.name}.`,
      },
    };
  }

  // "Temos oito Farofas Nutritivas"
  const temos = m.match(
    /^temos\s+(\S+)\s+(?:kg\s+|unidades?\s+|macos?\s+|potes?\s+)?(?:de\s+)?(.+)$/,
  );
  if (temos) {
    const qty = parseNumber(temos[1]);
    if (qty !== null) {
      const s = single(temos[2]);
      if (!s.product) return s.result!;
      return {
        type: "proposal",
        needsConfirmation: true,
        proposal: {
          kind: "set_stock",
          slug: s.product.slug,
          quantity: qty,
          summary: `Ajustar o estoque de ${s.product.name} para ${qty}.`,
        },
      };
    }
  }

  // "Hoje temos couve, rúcula, alface e cenoura"
  const hoje = m.match(/^hoje\s+temos\s+(.+)$/);
  if (hoje) {
    const parts = hoje[1]
      .split(/,|\se\s/)
      .map((p) => p.trim())
      .filter(Boolean);
    const slugs: string[] = [];
    const unknown: string[] = [];
    for (const part of parts) {
      const found = findProducts(part);
      if (found.length >= 1) slugs.push(found[0].slug);
      else unknown.push(part);
    }
    if (slugs.length === 0)
      return {
        type: "not_understood",
        message: "Não reconheci nenhum produto nessa lista.",
      };
    const names = slugs
      .map((s) => PRODUCTS.find((p) => p.slug === s)!.name)
      .join(", ");
    const extra = unknown.length
      ? ` (não reconheci: ${unknown.join(", ")})`
      : "";
    return {
      type: "proposal",
      needsConfirmation: true,
      proposal: {
        kind: "set_available_list",
        slugs,
        summary: `Marcar como disponíveis hoje: ${names}${extra}. Os itens da horta sem estoque recebem 1 unidade; confira as quantidades na tela Hoje.`,
      },
    };
  }

  // Mudança de preço: sempre exige o painel
  if (/(preco|valor)/.test(m)) {
    return {
      type: "not_understood",
      message:
        "Mudanças de preço, ingredientes e alergênicos só podem ser feitas pela tela de Produtos, com confirmação.",
    };
  }

  return {
    type: "not_understood",
    message:
      'Ainda não entendi essa frase. Exemplos: "Acabou o tomate", "Chegaram 10 alfaces", "Temos 8 Farofas Nutritivas", "Amanhã não haverá entrega", "Novo prato: lasanha de abobrinha".',
  };
}

export { PRODUCTS };
