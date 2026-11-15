/**
 * Links de imagem aceitos para importar foto (o servidor baixa o arquivo).
 * Só GitHub por enquanto: lista fechada evita que o servidor seja usado para
 * acessar endereços internos (SSRF).
 */
export const ALLOWED_IMAGE_HOSTS = new Set([
  "raw.githubusercontent.com",
  "user-images.githubusercontent.com",
  "private-user-images.githubusercontent.com",
  "objects.githubusercontent.com",
]);

/**
 * Aceita o link da página do GitHub (…/blob/main/foto.jpg) ou o raw, e devolve
 * o endereço raw. Null se não for um link de imagem do GitHub.
 */
export function toRawImageUrl(input: string): URL | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.hostname === "github.com") {
    // /{dono}/{repo}/blob/{branch}/{caminho} ou /raw/
    const m = /^\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/.exec(url.pathname);
    if (!m) return null;
    url = new URL(`https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`);
  }
  if (!ALLOWED_IMAGE_HOSTS.has(url.hostname)) return null;
  url.search = "";
  url.hash = "";
  return url;
}

/** Nome do arquivo no fim do link, decodificado ("Pão_integral_1.jpg"). */
export function fileNameFromUrl(url: URL) {
  const last = url.pathname.split("/").pop() ?? "";
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

/** Primeiro link http(s) dentro de uma mensagem. */
export function findUrl(text: string): string | null {
  return /https?:\/\/\S+/.exec(text)?.[0] ?? null;
}
