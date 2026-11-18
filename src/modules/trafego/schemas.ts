import { z } from "zod";

/** Tipos de evento que o banco aceita (D-047). Mude junto com a migration 0012. */
export const EVENT_KINDS = [
  "view",
  "add_to_cart",
  "remove_from_cart",
  "order_placed",
  "lead",
] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

const short = (max: number) => z.string().trim().max(max).optional();

export const eventSchema = z.object({
  visitor_id: z.uuid(),
  session_id: z.uuid(),
  kind: z.enum(EVENT_KINDS),
  path: z.string().trim().min(1).max(300).startsWith("/"),
  product_slug: short(120),
  quantity: z.number().int().min(1).max(999).optional(),
  source: short(120),
  medium: short(60),
  campaign: short(120),
  device: z.enum(["celular", "tablet", "computador"]).optional(),
});
export type SiteEvent = z.infer<typeof eventSchema>;

export const batchSchema = z.object({
  events: z.array(eventSchema).min(1).max(20),
});

/** Robôs de busca e ferramentas de teste não contam como visita. */
export function isBot(userAgent: string | null): boolean {
  if (!userAgent) return true;
  return /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|pagespeed|vercel/i.test(
    userAgent,
  );
}

/** Rótulo amigável da origem de uma visita. */
export function sourceLabel(source: string): string {
  const s = source.toLowerCase();
  if (s === "direto") return "Direto (digitou ou favorito)";
  if (s.includes("instagram")) return "Instagram";
  if (s.includes("facebook") || s === "fb") return "Facebook";
  if (s.includes("whatsapp") || s === "wa") return "WhatsApp";
  if (s.includes("google")) return "Google";
  if (s.includes("tiktok")) return "TikTok";
  return source;
}

export const PERIODS = [1, 7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];

export function toPeriod(raw: unknown): Period {
  const n = Number(raw);
  return (PERIODS as readonly number[]).includes(n) ? (n as Period) : 7;
}
