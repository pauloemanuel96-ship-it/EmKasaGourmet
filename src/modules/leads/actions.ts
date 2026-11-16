"use server";

import { createClient as createPublicClient } from "@supabase/supabase-js";
import { refresh } from "next/cache";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/modules/auth/staff";
import { LEAD_CONSENT_TEXT } from "./popup-config";
import { leadSchema, parseOrigin } from "./schemas";

export type LeadState =
  | { status: "idle" }
  | { status: "ok" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<string, string[]>>;
    };

/**
 * Cadastro no aviso de ofertas (D-037). Valida com Zod e chama a função SQL,
 * que confere o consentimento de novo. Usa a chave pública, sem sessão.
 */
export async function captureLead(
  _prev: LeadState,
  form: FormData,
): Promise<LeadState> {
  // Campo-isca: gente não vê nem preenche; robô preenche. Finge sucesso.
  if (String(form.get("website") ?? "") !== "") return { status: "ok" };

  const parsed = leadSchema.safeParse({
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    phone: String(form.get("phone") ?? ""),
    consent: form.get("consent") === "on",
    campaign: String(form.get("campaign") ?? "geral"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors,
    };
  }

  let env: ReturnType<typeof publicEnv>;
  try {
    env = publicEnv();
  } catch {
    return {
      status: "error",
      message: "O cadastro está indisponível no momento. Tente mais tarde.",
    };
  }
  const supabase = createPublicClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await supabase.rpc("capture_lead", {
    p_name: parsed.data.name,
    p_email: parsed.data.email,
    p_phone: parsed.data.phone,
    p_campaign: parsed.data.campaign,
    p_consent: true,
    p_consent_text: LEAD_CONSENT_TEXT,
    p_origin: parseOrigin(form.get("origin")),
  });
  if (error) {
    console.error("[leads] cadastro falhou:", error.message);
    return {
      status: "error",
      message: "Não deu para concluir o cadastro agora. Tente de novo.",
    };
  }
  return { status: "ok" };
}

/** Apaga um contato a pedido da pessoa (LGPD). Só owner e admin. */
export async function deleteLead(form: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "owner" && user.role !== "admin")) return;
  const id = String(form.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const supabase = await createClient();
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) console.error("[leads] apagar falhou:", error.message);
  refresh();
}
