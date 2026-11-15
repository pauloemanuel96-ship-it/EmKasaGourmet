const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Valores monetários são guardados em centavos (inteiro). Ver CLAUDE.md, regra 8. */
export function formatCents(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new TypeError(`Valor em centavos deve ser inteiro: ${cents}`);
  }
  return brl.format(cents / 100);
}

/**
 * Converte o que a pessoa digitou ("12,50", "R$ 1.234,56", "12.5", "1234") em centavos.
 * Vazio → null. Texto que não é valor → undefined (o formulário mostra o erro).
 * Não usa ponto flutuante: separa reais e centavos como texto.
 */
export function parseBRLToCents(input: string): number | null | undefined {
  let s = input.replace(/R\$/gi, "").replace(/\s/g, "");
  if (s === "") return null;
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (!/^\d+\.\d{1,2}$/.test(s)) {
    // Sem vírgula, ponto só vale como decimal se tiver 1 ou 2 casas ("12.5").
    // Fora disso é separador de milhar ("1.234").
    s = s.replace(/\./g, "");
  }
  const match = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(s);
  if (!match) return undefined;
  const reais = Number(match[1]);
  const centavos = Number((match[2] ?? "").padEnd(2, "0"));
  return reais * 100 + centavos;
}

/** Centavos → texto para preencher o campo de preço ("12,50"). */
export function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  const reais = Math.floor(cents / 100);
  const centavos = String(cents % 100).padStart(2, "0");
  return `${reais},${centavos}`;
}
