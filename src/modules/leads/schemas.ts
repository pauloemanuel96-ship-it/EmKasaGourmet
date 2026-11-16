import { z } from "zod";

/** Origem do primeiro acesso: de onde a pessoa veio. Tudo opcional. */
export const ORIGIN_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "referrer",
  "landing_path",
] as const;
export type LeadOrigin = Partial<Record<(typeof ORIGIN_KEYS)[number], string>>;

const digits = (v: string) => v.replace(/\D/g, "");

export const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome.")
    .max(80, "Nome muito longo."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(160, "E-mail muito longo.")
    .pipe(z.email("Informe um e-mail válido.")),
  phone: z
    .string()
    .transform(digits)
    .refine(
      (v) => v === "" || (v.length >= 10 && v.length <= 13),
      "Informe o celular com DDD, só números.",
    ),
  consent: z.literal(true, "Marque a caixa para receber as ofertas."),
  campaign: z.enum(["black-friday", "geral"]),
});

/** Lê a origem enviada pelo navegador e descarta o que não for esperado. */
export function parseOrigin(raw: unknown): LeadOrigin {
  let data: unknown = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (!data || typeof data !== "object") return {};
  const out: LeadOrigin = {};
  for (const key of ORIGIN_KEYS) {
    const v = (data as Record<string, unknown>)[key];
    if (typeof v === "string" && v.trim() !== "") {
      out[key] = v
        .trim()
        .slice(0, key === "referrer" || key === "landing_path" ? 300 : 200);
    }
  }
  return out;
}

/** Como a origem aparece no painel, numa linha. */
export function originLabel(o: LeadOrigin): string {
  if (o.gclid) return "Google Ads";
  if (o.fbclid) return "Facebook / Instagram Ads";
  if (o.utm_source) {
    return [o.utm_source, o.utm_medium].filter(Boolean).join(" · ");
  }
  if (o.referrer) return o.referrer;
  return "Direto";
}
