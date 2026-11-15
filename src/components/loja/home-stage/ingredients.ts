/**
 * Ingredientes da salada ilustrada da home, de baixo para cima no pote.
 * É só a vitrine 3D: não é cadastro de produto nem ficha técnica.
 * Fica separado da cena para a página não carregar o three.js antes da hora.
 */
export type StageIngredient = { id: string; label: string; color: string };

export const STAGE_INGREDIENTS: StageIngredient[] = [
  { id: "molho", label: "Molho", color: "#e2b13c" },
  { id: "grao", label: "Grão-de-bico", color: "#ecd9a6" },
  { id: "cenoura", label: "Cenoura ralada", color: "#f59a3c" },
  { id: "repolho", label: "Repolho roxo", color: "#c79ad0" },
  { id: "pepino", label: "Pepino", color: "#cfe3a6" },
  { id: "brocolis", label: "Brócolis", color: "#7fb548" },
  { id: "alface", label: "Alface", color: "#a9d466" },
  { id: "tomate", label: "Tomate-cereja", color: "#f0705f" },
];

/** Trechos do scroll (0 a 1) em que cada momento da cena acontece. */
export const STAGE_BEATS = {
  heroEnd: 0.09,
  saladStart: 0.12,
  assembleStart: 0.1,
  assembleEnd: 0.42,
  saladEnd: 0.6,
  swapStart: 0.6,
  farofaStart: 0.7,
  lidStart: 0.76,
  lidEnd: 0.9,
} as const;
