/** URL pública do site. Usada nos links enviados por e-mail (não confiar no header Origin). */
export function siteUrl(): string {
  // Na Vercel, o endereço de produção vem do próprio ambiente quando a
  // variável NEXT_PUBLIC_SITE_URL não foi definida.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (vercel ? `https://${vercel}` : "http://localhost:3000");
  return url.replace(/\/+$/, "");
}
