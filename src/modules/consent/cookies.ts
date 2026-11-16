/**
 * Consentimento de cookies (D-045). Três grupos: necessários (sempre ligados),
 * medição (registro de visitas e funil) e anúncios (Google Ads e Meta Ads).
 * A escolha fica num cookie próprio do site, para o servidor também poder
 * conferir antes de registrar qualquer coisa. Nada de medição ou anúncio roda
 * sem a escolha gravada aqui.
 */

export const CONSENT_COOKIE = "emk_consent";
/** Sobe quando os textos ou os grupos mudarem: a pessoa escolhe de novo. */
export const CONSENT_VERSION = 1;
/** A escolha vale por 6 meses; depois o aviso volta. */
export const CONSENT_MAX_AGE_DAYS = 180;
/** Evento disparado na janela quando a escolha muda. */
export const CONSENT_EVENT = "emk:consent";
/** Evento para reabrir as preferências (link do rodapé). */
export const CONSENT_OPEN_EVENT = "emk:consent-open";

export type ConsentChoice = {
  measurement: boolean;
  ads: boolean;
};
export type StoredConsent = ConsentChoice & { v: number; at: string };

export const CONSENT_GROUPS = [
  {
    key: "necessary",
    title: "Necessários",
    text: "Mantêm o login, o carrinho, o tema e esta própria escolha. Sem eles a loja não funciona, por isso ficam sempre ligados.",
  },
  {
    key: "measurement",
    title: "Medição",
    text: "Contam visitas e mostram por onde as pessoas passam na loja, para melhorarmos as páginas. Os dados ficam com a Emkasa.",
  },
  {
    key: "ads",
    title: "Anúncios",
    text: "Avisam o Google e a Meta quando alguém chega por um anúncio e compra, para mostrarmos anúncios a quem tem interesse.",
  },
] as const;

/** Lê o valor do cookie. Escolha de versão antiga ou inválida vale como "sem escolha". */
export function parseConsent(
  raw: string | null | undefined,
): StoredConsent | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(decodeURIComponent(raw)) as Partial<StoredConsent>;
    if (data.v !== CONSENT_VERSION) return null;
    if (typeof data.measurement !== "boolean" || typeof data.ads !== "boolean")
      return null;
    if (typeof data.at !== "string" || Number.isNaN(Date.parse(data.at)))
      return null;
    return {
      v: data.v,
      at: data.at,
      measurement: data.measurement,
      ads: data.ads,
    };
  } catch {
    return null;
  }
}

export function serializeConsent(choice: ConsentChoice, now = new Date()) {
  const stored: StoredConsent = {
    v: CONSENT_VERSION,
    at: now.toISOString(),
    measurement: choice.measurement,
    ads: choice.ads,
  };
  return encodeURIComponent(JSON.stringify(stored));
}

/** Procura o cookie de consentimento numa string `document.cookie`. */
export function consentFromCookieString(cookies: string): StoredConsent | null {
  for (const part of cookies.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === CONSENT_COOKIE) return parseConsent(rest.join("="));
  }
  return null;
}

// --- No navegador ---------------------------------------------------------

export function readConsent(): StoredConsent | null {
  if (typeof document === "undefined") return null;
  return consentFromCookieString(document.cookie);
}

export function saveConsent(choice: ConsentChoice) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${serializeConsent(choice)}; Path=/; Max-Age=${CONSENT_MAX_AGE_DAYS * 86_400}; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT));
}

/** A pessoa já permitiu este grupo? Sem escolha, a resposta é não. */
export function allows(group: keyof ConsentChoice): boolean {
  return readConsent()?.[group] === true;
}

export function openConsentPreferences() {
  window.dispatchEvent(new CustomEvent(CONSENT_OPEN_EVENT));
}
