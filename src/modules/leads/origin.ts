import { ORIGIN_KEYS, type LeadOrigin } from "./schemas";

const KEY = "emkasa:origem";

/**
 * Guarda no aparelho de onde a pessoa veio no PRIMEIRO acesso (campanha do
 * anúncio, site de origem, página de entrada). Fica só no navegador dela; só
 * vai para o servidor junto com um cadastro que ela mesma envia.
 */
export function rememberOrigin(): LeadOrigin {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return JSON.parse(saved) as LeadOrigin;
    const params = new URLSearchParams(location.search);
    const origin: LeadOrigin = {};
    for (const key of ORIGIN_KEYS) {
      const v = params.get(key);
      if (v) origin[key] = v.slice(0, 200);
    }
    if (document.referrer) {
      try {
        const host = new URL(document.referrer).hostname;
        if (host && host !== location.hostname) origin.referrer = host;
      } catch {
        // referência inválida: ignora
      }
    }
    origin.landing_path = location.pathname.slice(0, 300);
    localStorage.setItem(KEY, JSON.stringify(origin));
    return origin;
  } catch {
    return {};
  }
}
