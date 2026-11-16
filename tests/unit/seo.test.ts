import { describe, expect, it } from "vitest";
import type { StoreProduct } from "@/modules/catalogo/store-types";
import { jsonLd, productLd } from "@/modules/seo/json-ld";

const base = {
  slug: "farofa",
  name: "Farofa Nutritiva de Soja",
  short: "Farofa da casa",
  description: null,
  categoryName: "Produtos da Emkasa",
  priceCents: 1890,
  quoteOnly: false,
  available: true,
  isDemo: false,
  comingSoon: false,
  cover: null,
  gallery: [],
} as unknown as StoreProduct;

describe("dados estruturados de produto", () => {
  it("produto à venda sai com preço em reais", () => {
    expect(productLd(base)).toMatchObject({
      "@type": "Product",
      name: "Farofa Nutritiva de Soja",
      offers: { price: "18.90", priceCurrency: "BRL" },
    });
  });
  it("demonstração não gera nada; orçamento e 'em breve' saem sem oferta", () => {
    expect(productLd({ ...base, isDemo: true })).toBeNull();
    expect(productLd({ ...base, quoteOnly: true })).not.toHaveProperty(
      "offers",
    );
    expect(productLd({ ...base, comingSoon: true })).not.toHaveProperty(
      "offers",
    );
    expect(productLd({ ...base, priceCents: null })).not.toHaveProperty(
      "offers",
    );
  });
  it("não deixa o texto fechar a tag de script", () => {
    expect(jsonLd({ name: "</script><b>" })).not.toContain("</script>");
  });
});
