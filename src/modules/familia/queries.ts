import "server-only";
import { createClient } from "@/lib/supabase/server";
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
