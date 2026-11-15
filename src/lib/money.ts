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
