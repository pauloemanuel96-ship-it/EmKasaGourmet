import { z } from "zod";

const digits = (v: string) => v.replace(/\D/g, "");
const optional = (max: number, msg: string) =>
  z
    .string()
    .trim()
    .max(max, msg)
    .transform((v) => (v === "" ? null : v));

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(160, "E-mail muito longo.")
  .pipe(z.email("Informe um e-mail válido."));
const password = z
  .string()
  .min(8, "A senha precisa de pelo menos 8 caracteres.")
  .max(72, "Senha muito longa.");
const name = z
  .string()
  .trim()
  .min(2, "Informe seu nome.")
  .max(80, "Nome muito longo.");
const phone = z
  .string()
  .transform(digits)
  .refine(
    (v) => v === "" || (v.length >= 10 && v.length <= 13),
    "Informe o celular com DDD, só números.",
  )
  .transform((v) => (v === "" ? null : v));

export const signUpSchema = z.object({
  name,
  email,
  password,
  phone,
  marketing: z.boolean(),
});
export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Informe a senha."),
});
export const emailSchema = z.object({ email });
export const passwordSchema = z.object({ password });
export const profileSchema = z.object({ name, phone, marketing: z.boolean() });

export const UF = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export const addressSchema = z.object({
  id: z.uuid().optional(),
  label: z
    .string()
    .trim()
    .min(1, "Dê um nome a este endereço (ex.: Casa).")
    .max(40, "Nome muito longo."),
  recipient: optional(80, "Nome muito longo."),
  cep: z
    .string()
    .transform(digits)
    .refine((v) => v.length === 8, "O CEP tem 8 números."),
  street: z
    .string()
    .trim()
    .min(1, "Informe a rua.")
    .max(120, "Rua muito longa."),
  number: z
    .string()
    .trim()
    .min(1, "Informe o número (ou s/n).")
    .max(15, "Número muito longo."),
  complement: optional(60, "Complemento muito longo."),
  district: z
    .string()
    .trim()
    .min(1, "Informe o bairro.")
    .max(80, "Bairro muito longo."),
  city: z
    .string()
    .trim()
    .min(1, "Informe a cidade.")
    .max(80, "Cidade muito longa."),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => (UF as readonly string[]).includes(v), "Escolha o estado."),
  reference: optional(120, "Referência muito longa."),
  isDefault: z.boolean(),
});

export type FormState =
  | { status: "idle" }
  | { status: "ok"; message?: string }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<string, string[]>>;
      /** O que a pessoa digitou, para o formulário não voltar vazio. */
      values?: Record<string, string>;
    };

/** Transforma os erros do Zod no formato que os formulários mostram. */
export function toFormError(error: z.ZodError): FormState {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    (fieldErrors[String(issue.path[0] ?? "form")] ??= []).push(issue.message);
  }
  return {
    status: "error",
    message: "Revise os campos destacados.",
    fieldErrors,
  };
}

/** Só aceita destino interno da área do cliente (evita redirecionar para fora). */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/minha-casa") || next.includes("//")) {
    return "/minha-casa";
  }
  return next;
}

/** 49000000 -> 49000-000 */
export function formatCep(cep: string): string {
  const d = digits(cep);
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : cep;
}
