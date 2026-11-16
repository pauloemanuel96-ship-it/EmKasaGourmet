/**
 * Família da conta no formato do BOX (D-046). Regra fixa, nunca IA:
 * - alergias: os grupos andam juntos nos dois sentidos, como na tabela
 *   `allergen_groups` do banco (glúten com trigo, centeio, cevada e aveia;
 *   castanhas com cada castanha);
 * - dieta: a mesma lista do cadastro;
 * - "não gosta": casa com o nome do produto, sem acento, maiúscula ou plural.
 */
import type { AllergenCode, DietLabel } from "@/demo/data";
import type { Member } from "@/demo/logic";
import type { Diet } from "./schemas";

/** Espelho de `allergen_groups` (migration 20261116001100). */
export const ALLERGEN_GROUPS: Record<string, readonly string[]> = {
  gluten: ["trigo", "centeio", "cevada", "aveia"],
  castanhas: [
    "amendoa",
    "avela",
    "castanha_de_caju",
    "castanha_do_para",
    "macadamia",
    "nozes",
    "peca",
    "pistache",
    "pinoli",
  ],
};

const BOX_ALLERGENS: readonly AllergenCode[] = [
  "gluten",
  "leite",
  "lactose",
  "ovos",
  "soja",
  "amendoim",
  "castanhas",
  "castanha_de_caju",
  "trigo",
];

/** Soma os parentes de cada alergênico, nos dois sentidos. */
export function expandAllergens(codes: readonly string[]): string[] {
  const out = new Set(codes);
  for (const code of codes) {
    for (const [parent, children] of Object.entries(ALLERGEN_GROUPS)) {
      if (code === parent) children.forEach((c) => out.add(c));
      if (children.includes(code)) out.add(parent);
    }
  }
  return [...out];
}

function tokens(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((t) => (t.length > 3 ? t.replace(/s$/, "") : t));
}

/** "tomates" casa com "Tomate italiano"; "banana prata" com "Banana-prata". */
export function dislikeMatches(dislike: string, productName: string): boolean {
  const want = tokens(dislike);
  if (want.length === 0) return false;
  const have = new Set(tokens(productName));
  return want.every((t) => have.has(t));
}

export type RealMember = {
  id: string;
  name: string;
  diet: Diet;
  allergies: string[];
  dislikes: string[];
};

export function toBoxMembers(
  members: readonly RealMember[],
  products: readonly { slug: string; name: string }[],
): Member[] {
  return members.map((m) => ({
    id: m.id,
    nickname: m.name,
    allergies: expandAllergens(m.allergies).filter((c): c is AllergenCode =>
      (BOX_ALLERGENS as readonly string[]).includes(c),
    ),
    diet: m.diet as DietLabel | "sem_restricao",
    dislikes: products
      .filter((p) => m.dislikes.some((d) => dislikeMatches(d, p.name)))
      .map((p) => p.slug),
  }));
}
