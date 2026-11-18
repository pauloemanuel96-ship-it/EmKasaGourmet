"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/modules/auth/staff";
import type { FormState } from "@/modules/conta/schemas";
import { chefRequestSchema, chefUpdateSchema } from "./schemas";

const FIELDS = [
  "format",
  "desiredDate",
  "period",
  "neighborhood",
  "people",
  "notes",
  "restrictions",
  "name",
  "phone",
  "email",
] as const;

/**
 * Pedido de proposta do Chef Emkasa (D-049). Valida com Zod e chama a função
 * SQL, que confere tudo de novo (autorização de saúde, data, limite).
 */
export async function requestChef(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  // Campo-isca: gente não vê nem preenche; robô preenche. Finge sucesso.
  if (String(form.get("website") ?? "") !== "") {
    return { status: "ok", message: "Pedido recebido." };
  }
  const values = Object.fromEntries(
    FIELDS.map((f) => [f, String(form.get(f) ?? "")]),
  ) as Record<(typeof FIELDS)[number], string>;
  const parsed = chefRequestSchema.safeParse({
    ...values,
    healthConsent: form.get("healthConsent") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      (fieldErrors[String(issue.path[0] ?? "form")] ??= []).push(issue.message);
    }
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors,
      values,
    };
  }
  const d = parsed.data;
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("request_chef", {
      p_format: d.format,
      p_desired_date: d.desiredDate,
      p_period: d.period ?? "",
      p_neighborhood: d.neighborhood,
      p_people: d.people,
      p_notes: d.notes ?? "",
      p_restrictions: d.restrictions ?? "",
      p_health_consent: d.healthConsent,
      p_name: d.name,
      p_phone: d.phone,
      p_email: d.email ?? "",
    });
    if (error) {
      // Mensagens da função SQL já vêm em português e para o cliente.
      const known = /autorizar|hoje ou depois|já recebemos|e-mail/i.test(
        error.message,
      );
      if (!known) console.error("[chef] pedido falhou:", error.message);
      return {
        status: "error",
        message: known
          ? error.message
          : "Não conseguimos enviar agora. Tente de novo em instantes.",
        values,
      };
    }
  } catch (e) {
    console.error("[chef] pedido falhou:", e);
    return {
      status: "error",
      message: "Não conseguimos enviar agora. Tente de novo em instantes.",
      values,
    };
  }
  return {
    status: "ok",
    message:
      "Pedido recebido! A equipe da Chef vai falar com você pelo WhatsApp para montar a proposta.",
  };
}

/** Painel: muda o andamento e a anotação interna de um pedido. */
export async function updateChefRequest(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const gate = await requireStaff(["owner", "admin"]);
  if (!gate.allowed) return { status: "error", message: "Sem acesso." };
  const parsed = chefUpdateSchema.safeParse({
    id: String(form.get("id") ?? ""),
    status: String(form.get("status") ?? ""),
    staffNotes: String(form.get("staffNotes") ?? ""),
  });
  if (!parsed.success) {
    return { status: "error", message: "Dados inválidos." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("chef_requests")
    .update({
      status: parsed.data.status,
      staff_notes: parsed.data.staffNotes,
    })
    .eq("id", parsed.data.id);
  if (error) {
    console.error("[chef] atualização falhou:", error.message);
    return { status: "error", message: "Não foi possível salvar." };
  }
  refresh();
  return { status: "ok", message: "Salvo." };
}
