import { CONSENT_COOKIE, parseConsent } from "@/modules/consent/cookies";
import { batchSchema, isBot } from "@/modules/trafego/schemas";
import { createClient } from "@/lib/supabase/server";

/**
 * Recebe os eventos de visita do navegador (D-047). Só grava se o cookie de
 * consentimento permitir "Medição": o servidor confere de novo, não confia só
 * no navegador. Responde sempre 204, para não expor nada a quem testa a rota.
 */
export async function POST(request: Request) {
  const done = new Response(null, { status: 204 });
  if (isBot(request.headers.get("user-agent"))) return done;

  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  const consent = parseConsent(cookie?.slice(CONSENT_COOKIE.length + 1));
  if (!consent?.measurement) return done;

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 32_000) return done;
    body = JSON.parse(text);
  } catch {
    return done;
  }
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) return done;

  const supabase = await createClient();
  const { error } = await supabase.rpc("track_events", {
    p_events: parsed.data.events,
  });
  if (error) console.warn("[trafego] gravação falhou:", error.message);
  return done;
}
