"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toFormError, type FormState } from "@/modules/conta/schemas";
import { getHouseholdFit } from "./queries";
import {
  HEALTH_CONSENT_TEXT,
  hasHealthData,
  memberSchema,
  summarizeFit,
  type FitSummary,
} from "./schemas";

const str = (form: FormData, key: string) => String(form.get(key) ?? "");

function keep(form: FormData, state: FormState): FormState {
  if (state.status !== "error") return state;
  const values: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (
      typeof value === "string" &&
      key !== "allergies" &&
      !key.startsWith("$")
    ) {
      values[key] = value;
    }
  }
  return { ...state, values };
}

/**
 * Salva uma pessoa da casa (D-043). Dado de saúde só entra com o
 * consentimento: se ainda não existe, a caixa do formulário precisa estar
 * marcada, e o aceite é gravado antes. O banco confere tudo de novo.
 */
export async function saveMember(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const id = str(form, "id");
  const parsed = memberSchema.safeParse({
    ...(id ? { id } : {}),
    name: str(form, "name"),
    relation: str(form, "relation"),
    birthYear: str(form, "birthYear"),
    diet: str(form, "diet") || "sem_restricao",
    allergies: form.getAll("allergies").map(String),
    likes: str(form, "likes"),
    dislikes: str(form, "dislikes"),
    goal: str(form, "goal"),
  });
  if (!parsed.success) return keep(form, toFormError(parsed.error));

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return { status: "error", message: "Entre na sua conta de novo." };
  }

  if (hasHealthData(parsed.data)) {
    const { data: active } = await supabase
      .from("consents")
      .select("id")
      .eq("kind", "health_profile")
      .is("revoked_at", null)
      .limit(1);
    if (!active?.length) {
      if (form.get("healthConsent") !== "on") {
        return keep(form, {
          status: "error",
          message:
            "Para guardar alergia, dieta ou objetivo, marque a autorização no fim do formulário.",
          fieldErrors: { healthConsent: ["Marque para autorizar."] },
        });
      }
      const { error } = await supabase
        .from("consents")
        .insert({ kind: "health_profile", consent_text: HEALTH_CONSENT_TEXT });
      if (error) {
        console.error("[familia] consentimento falhou:", error.message);
        return keep(form, {
          status: "error",
          message: "Não deu para registrar a autorização. Tente de novo.",
        });
      }
    }
  }

  const { id: memberId, birthYear, ...rest } = parsed.data;
  const row = { ...rest, birth_year: birthYear };
  const { error } = memberId
    ? await supabase.from("household_members").update(row).eq("id", memberId)
    : await supabase.from("household_members").insert(row);
  if (error) {
    const full = error.message.includes("Limite de 12");
    if (!full) console.error("[familia] salvar falhou:", error.message);
    return keep(form, {
      status: "error",
      message: full
        ? "Sua conta já tem 12 pessoas cadastradas."
        : "Não deu para salvar. Tente de novo.",
    });
  }
  refresh();
  return { status: "ok", message: "Salvo." };
}

export async function deleteMember(form: FormData): Promise<void> {
  const id = str(form, "id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("household_members")
    .delete()
    .eq("id", id);
  if (error) console.error("[familia] apagar falhou:", error.message);
  refresh();
}

/** Retira a autorização e apaga alergias, dietas e objetivos de todos da casa. */
export async function revokeHealthConsent(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_health_consent");
  if (error)
    console.error("[familia] retirar autorização falhou:", error.message);
  refresh();
}

/**
 * Resumo para a vitrine da loja: por produto, o pior caso da casa. Chamado
 * pelo navegador de quem está logado; devolve null para os demais.
 */
export async function loadHouseholdFit(): Promise<{
  people: number;
  bySlug: Record<string, FitSummary>;
} | null> {
  const fit = await getHouseholdFit();
  if (!fit) return null;
  const bySlug: Record<string, FitSummary> = {};
  for (const [slug, issues] of Object.entries(fit.issues)) {
    const summary = summarizeFit(issues);
    if (summary) bySlug[slug] = summary;
  }
  return { people: fit.members.length, bySlug };
}
