/**
 * Registro de visitas no navegador (D-047). Nada roda sem a permissão de
 * "Medição" no aviso de cookies. Os códigos são aleatórios: identificam o
 * navegador e a visita, não a pessoa. Retirar a permissão apaga os dois.
 */
import { CONSENT_EVENT, allows } from "@/modules/consent/cookies";
import type { EventKind, SiteEvent } from "./schemas";

const VISITOR_KEY = "emk:vid";
const SESSION_KEY = "emk:sid";
/** Parado por mais de 30 minutos, a próxima página abre uma visita nova. */
const SESSION_IDLE_MS = 30 * 60_000;

type Session = {
  id: string;
  last: number;
  source?: string;
  medium?: string;
  campaign?: string;
};

let queue: SiteEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let wired = false;

function uuid(): string {
  return crypto.randomUUID();
}

function device(): SiteEvent["device"] {
  const w = window.innerWidth;
  if (w < 640) return "celular";
  if (w < 1024 && matchMedia("(pointer: coarse)").matches) return "tablet";
  return "computador";
}

/** De onde veio esta visita: campanha do link, site de origem ou direto. */
function originNow(): Pick<Session, "source" | "medium" | "campaign"> {
  const q = new URLSearchParams(location.search);
  const utm = q.get("utm_source");
  if (utm) {
    return {
      source: utm.slice(0, 120),
      medium: q.get("utm_medium")?.slice(0, 60) ?? undefined,
      campaign: q.get("utm_campaign")?.slice(0, 120) ?? undefined,
    };
  }
  if (q.get("gclid")) return { source: "google", medium: "cpc" };
  if (q.get("fbclid")) return { source: "facebook", medium: "social" };
  try {
    if (document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, "");
      if (host && host !== location.hostname) {
        return { source: host, medium: "referral" };
      }
    }
  } catch {
    // referência inválida: segue como direto
  }
  return { source: "direto" };
}

function ids(): { visitor: string; session: Session } {
  let visitor = localStorage.getItem(VISITOR_KEY);
  if (!visitor) {
    visitor = uuid();
    localStorage.setItem(VISITOR_KEY, visitor);
  }
  const now = Date.now();
  let session: Session | null = null;
  try {
    session = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null");
  } catch {
    session = null;
  }
  if (!session || now - session.last > SESSION_IDLE_MS) {
    session = { id: uuid(), last: now, ...originNow() };
  }
  session.last = now;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { visitor, session };
}

function flush() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (queue.length === 0) return;
  const body = JSON.stringify({ events: queue.splice(0, 20) });
  const sent =
    typeof navigator.sendBeacon === "function" &&
    navigator.sendBeacon(
      "/api/t",
      new Blob([body], { type: "application/json" }),
    );
  if (!sent) {
    void fetch("/api/t", {
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  }
  if (queue.length > 0) flush();
}

function forget() {
  queue = [];
  try {
    localStorage.removeItem(VISITOR_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // armazenamento bloqueado: nada a apagar
  }
}

function wire() {
  if (wired) return;
  wired = true;
  addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  addEventListener(CONSENT_EVENT, () => {
    if (!allows("measurement")) forget();
  });
}

/** Registra um evento, se a pessoa permitiu medição. Nunca quebra a página. */
export function track(
  kind: EventKind,
  data: { path?: string; product_slug?: string; quantity?: number } = {},
) {
  try {
    if (typeof window === "undefined" || !allows("measurement")) return;
    wire();
    const { visitor, session } = ids();
    queue.push({
      visitor_id: visitor,
      session_id: session.id,
      kind,
      path: (data.path ?? location.pathname).slice(0, 300),
      product_slug: data.product_slug,
      quantity: data.quantity,
      source: session.source,
      medium: session.medium,
      campaign: session.campaign,
      device: device(),
    });
    if (queue.length >= 20) flush();
    else if (!timer) timer = setTimeout(flush, 1500);
  } catch {
    // medição nunca atrapalha a compra
  }
}
