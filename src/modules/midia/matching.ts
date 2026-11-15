/**
 * Acha o produto a partir de um nome de arquivo ou de uma frase
 * ("foto da farofa", "Almondega_OK.jpg", "emkasa_quiche de soja 1.jpg").
 * Nunca escolhe sozinho quando há dúvida: devolve os candidatos e o nível
 * de certeza, e a tela (ou o assistente) pergunta.
 */

export type MatchTarget = { id: string; slug: string; name: string };

export type MatchResult<T extends MatchTarget> =
  | { status: "exato"; product: T; index: number }
  | { status: "provavel"; product: T; index: number; others: T[] }
  | { status: "ambiguo"; options: T[]; index: number }
  | { status: "nenhum"; index: number };

/** Palavras que não ajudam a identificar o produto. */
const NOISE = new Set([
  "emkasa",
  "gourmet",
  "foto",
  "fotos",
  "img",
  "image",
  "imagem",
  "ok",
  "final",
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "com",
  "a",
  "o",
  "as",
  "os",
  "um",
  "uma",
  "essa",
  "esta",
  "esse",
  "este",
  "aqui",
  "coloca",
  "coloque",
  "poe",
  "bota",
  "produto",
  "nova",
  "novo",
  "frente",
  "fundo",
  "verso",
  "copia",
  "copy",
]);

export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Plural simples em português: "almondegas" ≈ "almondega", "paes" ≈ "pao". */
function stem(word: string) {
  if (word.length > 4 && word.endsWith("oes")) return word.slice(0, -3) + "ao";
  if (word.length > 4 && word.endsWith("aes")) return word.slice(0, -3) + "ao";
  if (word.length > 3 && word.endsWith("s")) return word.slice(0, -1);
  return word;
}

export function tokens(s: string) {
  return normalize(s)
    .split(" ")
    .filter((w) => w && !NOISE.has(w) && !/^\d+$/.test(w))
    .map(stem);
}

/** "Pão_integral_2.jpg" → { base: "pao integral", index: 2 } */
export function parseFileName(fileName: string) {
  const noExt = fileName.replace(/\.[a-z0-9]{2,5}$/i, "");
  const m = /[\s_-](\d{1,2})$/.exec(noExt.trim());
  return {
    base: normalize(m ? noExt.slice(0, m.index) : noExt),
    index: m ? Number(m[1]) : 1,
  };
}

function score(query: string[], target: string[]) {
  if (query.length === 0 || target.length === 0) return 0;
  const t = new Set(target);
  const shared = query.filter((w) => t.has(w)).length;
  // Todas as palavras do produto aparecem na busca: forte.
  const coverage = shared / t.size;
  const precision = shared / query.length;
  return coverage * 0.7 + precision * 0.3;
}

export function matchProduct<T extends MatchTarget>(
  text: string,
  products: T[],
  index = 1,
): MatchResult<T> {
  const q = tokens(text);
  if (q.length === 0) return { status: "nenhum", index };
  const qKey = q.join(" ");

  const exact = products.filter(
    (p) =>
      tokens(p.name).join(" ") === qKey || tokens(p.slug).join(" ") === qKey,
  );
  if (exact.length === 1) return { status: "exato", product: exact[0], index };
  if (exact.length > 1) return { status: "ambiguo", options: exact, index };

  const ranked = products
    .map((p) => ({
      p,
      s: Math.max(score(q, tokens(p.name)), score(q, tokens(p.slug))),
    }))
    .filter((r) => r.s >= 0.5)
    .sort((a, b) => b.s - a.s);
  if (ranked.length === 0) return { status: "nenhum", index };
  const [best, second] = ranked;
  if (second && best.s - second.s < 0.15) {
    return {
      status: "ambiguo",
      options: ranked.slice(0, 4).map((r) => r.p),
      index,
    };
  }
  return {
    status: "provavel",
    product: best.p,
    index,
    others: ranked.slice(1, 4).map((r) => r.p),
  };
}

/** Nome de arquivo sugerido para a foto de um produto. */
export function suggestedFileName(slug: string, index = 1) {
  return index > 1 ? `${slug}-${index}.webp` : `${slug}.webp`;
}
