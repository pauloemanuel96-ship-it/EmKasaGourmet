import type { StoreProduct } from "./store-types";

export function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Filtro puro (também usado nos testes). */
export function filterProducts(
  products: StoreProduct[],
  f: {
    secao: string | null;
    categoria: string | null;
    busca: string;
    sem: string[];
    dieta: string | null;
    soDisponiveis: boolean;
    isAvailable: (p: StoreProduct) => boolean;
  },
) {
  const q = norm(f.busca);
  return products.filter((p) => {
    if (f.secao && p.sectionSlug !== f.secao) return false;
    if (f.categoria && p.categorySlug !== f.categoria) return false;
    if (
      q &&
      !norm(`${p.name} ${p.short ?? ""} ${p.ingredients.join(" ")}`).includes(q)
    )
      return false;
    if (f.sem.length > 0) {
      // Ficha não validada nunca entra num filtro de segurança (RN-08).
      if (!p.allergensValidated) return false;
      // "Pode conter" também exclui (RN-09).
      if (f.sem.some((g) => p.blockedGroups.includes(g))) return false;
    }
    if (f.dieta) {
      const codes = p.diet.map((d) => d.code);
      if (
        !codes.includes(f.dieta) &&
        !(f.dieta === "vegetariano" && codes.includes("vegano"))
      )
        return false;
    }
    if (f.soDisponiveis && !f.isAvailable(p)) return false;
    return true;
  });
}
