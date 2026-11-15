export const MEDIA_BUCKET = "produtos";

export const MEDIA_KINDS = [
  "galeria",
  "embalagem",
  "composicao",
  "apresentacao",
] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export const MEDIA_KIND_LABEL: Record<MediaKind, string> = {
  galeria: "Galeria",
  embalagem: "Embalagem",
  composicao: "Composição",
  apresentacao: "Apresentação",
};

/** Caminho do arquivo no bucket: pasta do produto + nome único. */
export function mediaPath(productSlug: string, now = new Date()) {
  const stamp = now.toISOString().replace(/\D/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8);
  const folder = productSlug.replace(/[^a-z0-9-]/g, "") || "sem-produto";
  return `${folder}/${stamp}-${rand}.webp`;
}

export function publicMediaUrl(supabaseUrl: string, path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}
