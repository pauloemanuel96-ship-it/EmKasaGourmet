/** URL pública do site. Usada nos links enviados por e-mail (não confiar no header Origin). */
export function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return url.replace(/\/+$/, "");
}
