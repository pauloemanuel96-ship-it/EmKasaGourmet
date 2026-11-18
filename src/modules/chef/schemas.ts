import { z } from "zod";

/**
 * Chef Emkasa (D-049): a Chef na casa do cliente. Preço, agenda e bairros
 * ainda não foram definidos pela empresa: a página pede proposta, não vende.
 */
export const CHEF_FORMATS = [
  {
    code: "ocasiao",
    name: "Chef Emkasa Ocasião",
    tag: "Para comemorar",
    text: "Jantar, almoço ou brunch na sua casa, com menu da cozinha natural da Emkasa. A Chef compra, cozinha, serve e deixa a cozinha limpa.",
  },
  {
    code: "semana",
    name: "Chef Emkasa Semana",
    tag: "Para a rotina",
    text: "Uma visita para cozinhar a comida dos próximos dias. Tudo porcionado nas embalagens transparentes da Emkasa, com etiqueta de prato, pessoa e data.",
  },
  {
    code: "assinatura",
    name: "Assinatura Semana",
    tag: "Para não pensar nisso",
    text: "Visitas fixas no mês, no mesmo dia da semana, com prioridade na agenda. Para quem gostou da primeira visita.",
  },
] as const;
export type ChefFormat = (typeof CHEF_FORMATS)[number]["code"];

export const CHEF_PERIODS = [
  { code: "manha", label: "Manhã" },
  { code: "almoco", label: "Almoço" },
  { code: "tarde", label: "Tarde" },
  { code: "jantar", label: "Jantar" },
] as const;

export const CHEF_STATUS = [
  { code: "novo", label: "Novo" },
  { code: "em_conversa", label: "Em conversa" },
  { code: "proposta_enviada", label: "Proposta enviada" },
  { code: "confirmado", label: "Confirmado" },
  { code: "realizado", label: "Realizado" },
  { code: "cancelado", label: "Cancelado" },
] as const;
export type ChefStatus = (typeof CHEF_STATUS)[number]["code"];

/** Cidade atendida hoje. O Rio vem depois (estudo do Chef Emkasa). */
export const CHEF_CITY = "Aracaju";

export const CHEF_HEALTH_CONSENT_TEXT =
  "Autorizo a Emkasa a usar as alergias e restrições que escrevi apenas para preparar este atendimento.";

const optionalText = (max: number, msg: string) =>
  z
    .string()
    .trim()
    .max(max, msg)
    .transform((v) => (v === "" ? null : v));

export const chefRequestSchema = z
  .object({
    format: z.enum(["ocasiao", "semana", "assinatura"], {
      error: "Escolha um formato.",
    }),
    desiredDate: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v),
        "Data inválida.",
      )
      .transform((v) => (v === "" ? null : v)),
    period: z
      .enum(["", "manha", "almoco", "tarde", "jantar"])
      .transform((v) => (v === "" ? null : v)),
    neighborhood: z
      .string()
      .trim()
      .min(2, "Diga o bairro.")
      .max(80, "Bairro muito longo."),
    people: z.coerce
      .number({ error: "Quantas pessoas?" })
      .int("Use um número inteiro.")
      .min(1, "Pelo menos 1 pessoa.")
      .max(40, "Para mais de 40 pessoas, fale com a equipe."),
    notes: optionalText(1000, "Texto muito longo."),
    restrictions: optionalText(600, "Texto muito longo."),
    healthConsent: z.boolean(),
    name: z
      .string()
      .trim()
      .min(2, "Diga seu nome.")
      .max(80, "Nome muito longo."),
    phone: z
      .string()
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => v.length >= 10 && v.length <= 13, "WhatsApp com DDD."),
    email: z
      .string()
      .trim()
      .max(160)
      .refine(
        (v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
        "E-mail inválido.",
      )
      .transform((v) => (v === "" ? null : v.toLowerCase())),
  })
  .refine((d) => d.restrictions === null || d.healthConsent, {
    path: ["healthConsent"],
    message: "Para enviar alergias e restrições, marque a autorização.",
  });
export type ChefRequestInput = z.infer<typeof chefRequestSchema>;

export const chefUpdateSchema = z.object({
  id: z.uuid(),
  status: z.enum([
    "novo",
    "em_conversa",
    "proposta_enviada",
    "confirmado",
    "realizado",
    "cancelado",
  ]),
  staffNotes: optionalText(2000, "Anotação muito longa."),
});

export function formatLabel(code: string): string {
  return CHEF_FORMATS.find((f) => f.code === code)?.name ?? code;
}
export function periodLabel(code: string | null): string | null {
  return CHEF_PERIODS.find((p) => p.code === code)?.label ?? null;
}
export function statusLabel(code: string): string {
  return CHEF_STATUS.find((s) => s.code === code)?.label ?? code;
}
