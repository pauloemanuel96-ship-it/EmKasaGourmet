import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { HOME_CAMPAIGN } from "@/modules/campanhas/home-campaign";
import { getStoreCatalog } from "@/modules/catalogo/store";

/** Mapa do site para os buscadores (D-039). Produto de demonstração fica de fora. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const pages = [
    "",
    "/loja",
    "/encomendas",
    "/box",
    "/receitas",
    "/escola",
    "/clube",
  ];
  if (HOME_CAMPAIGN === "natal") pages.push("/natal");
  const catalog = await getStoreCatalog();
  const products = catalog.products
    .filter((p) => !p.isDemo)
    .map((p) => `/produto/${p.slug}`);
  return [...pages, ...products].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path.startsWith("/produto") ? "weekly" : "daily",
    priority: path === "" ? 1 : path.startsWith("/produto") ? 0.7 : 0.8,
  }));
}
