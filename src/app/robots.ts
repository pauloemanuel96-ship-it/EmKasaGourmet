import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** O que os buscadores podem ler (D-039): a loja sim; painel e área pessoal não. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/auth",
        "/carrinho",
        "/checkout",
        "/pedido",
        "/minha-casa",
        "/offline",
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
