import { siteUrl } from "@/lib/site";
import type { StoreProduct } from "@/modules/catalogo/store-types";

/**
 * Dados estruturados (schema.org) que o Google lê para entender a empresa e os
 * produtos (D-039). Só entra o que é verdade e está visível na página: nada de
 * preço ou disponibilidade de item de demonstração.
 */

/** Serializa para dentro de <script>: escapa "<" para não fechar a tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function organizationLd() {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Emkasa Gourmet",
    url,
    logo: `${url}/icons/icon-512.png`,
    slogan: "Alimentar é uma forma de cuidar.",
    foundingDate: "2016",
  };
}

/** Produto real: nome, foto e descrição; oferta só quando há preço de venda. */
export function productLd(p: StoreProduct) {
  if (p.isDemo) return null;
  const url = `${siteUrl()}/produto/${p.slug}`;
  const sellable =
    !p.comingSoon && !p.quoteOnly && p.priceCents !== null && p.priceCents > 0;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    url,
    ...(p.description || p.short
      ? { description: p.description ?? p.short }
      : {}),
    ...(p.cover
      ? { image: [p.cover.url, ...p.gallery.map((g) => g.url)] }
      : {}),
    category: p.categoryName,
    brand: { "@type": "Brand", name: "Emkasa Gourmet" },
    ...(sellable
      ? {
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: "BRL",
            price: (p.priceCents! / 100).toFixed(2),
            availability: p.available
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        }
      : {}),
  };
}
