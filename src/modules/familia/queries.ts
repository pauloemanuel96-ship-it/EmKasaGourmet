import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PRODUCTS } from "@/demo/data";
import type { Member } from "@/demo/logic";
import { toBoxMembers } from "./box-profile";
import type { Diet } from "./schemas";

export type HouseholdMember = {
  id: string;
  name: string;
  relation: string | null;
  birth_year: number | null;
  diet: Diet;
  allergies: string[];
  likes: string[];
  dislikes: string[];
  goal: string | null;
};

export type Household = {
  members: HouseholdMember[];
  healthConsent: boolean;
  allergens: { code: string; name: string }[];
};

/** Família da conta logada. O RLS só devolve as linhas do próprio dono. */
export async function getHousehold(): Promise<Household> {
  const supabase = await createClient();
  const [members, consent, allergens] = await Promise.all([
    supabase
      .from("household_members")
      .select(
        "id, name, relation, birth_year, diet, allergies, likes, dislikes, goal",
      )
      .order("created_at", { ascending: true }),
    supabase
      .from("consents")
      .select("id")
      .eq("kind", "health_profile")
      .is("revoked_at", null)
      .limit(1),
    supabase.from("allergens").select("code, name").order("name"),
  ]);
  if (members.error) {
    console.error("[familia] leitura falhou:", members.error.message);
  }
  return {
    members: (members.data ?? []) as HouseholdMember[],
    healthConsent: (consent.data ?? []).length > 0,
    allergens: allergens.data ?? [],
  };
}

export type FitVerdict = "blocked" | "unknown" | "diet";
export type FitIssue = {
  memberId: string;
  memberName: string;
  verdict: FitVerdict;
  reasons: string[];
};
export type HouseholdFit = {
  members: { id: string; name: string }[];
  /** Por slug de produto: só quem tem impedimento ou dúvida. Quem não aparece, serve. */
  issues: Record<string, FitIssue[]>;
};

/**
 * "Serve para a minha casa?" (D-044). A conta é feita no banco
 * (household_fit), com regra fixa. Devolve null sem login ou sem ninguém
 * cadastrado.
 */
export async function getHouseholdFit(): Promise<HouseholdFit | null> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return null;
  const [members, fit] = await Promise.all([
    supabase
      .from("household_members")
      .select("id, name")
      .order("created_at", { ascending: true }),
    supabase.rpc("household_fit"),
  ]);
  if (!members.data?.length) return null;
  if (fit.error) {
    console.error("[familia] conferência falhou:", fit.error.message);
    return null;
  }
  const issues: Record<string, FitIssue[]> = {};
  for (const row of (fit.data ?? []) as {
    product_slug: string;
    member_id: string;
    member_name: string;
    verdict: FitVerdict;
    reasons: string[];
  }[]) {
    (issues[row.product_slug] ??= []).push({
      memberId: row.member_id,
      memberName: row.member_name,
      verdict: row.verdict,
      reasons: row.reasons,
    });
  }
  return { members: members.data, issues };
}

export type BoxHousehold = {
  /** Pessoas no formato do BOX, com as regras de box-profile.ts. */
  members: Member[];
  healthConsent: boolean;
};

/**
 * Família da conta para montar o BOX (D-046). Devolve null sem login: aí o
 * BOX continua com o editor de demonstração do navegador.
 */
export async function getBoxHousehold(): Promise<BoxHousehold | null> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return null;
  const household = await getHousehold();
  const boxProducts = PRODUCTS.filter((p) => p.unit === "horta");
  return {
    members: toBoxMembers(household.members, boxProducts),
    healthConsent: household.healthConsent,
  };
}
