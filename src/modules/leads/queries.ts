import "server-only";
import { createClient } from "@/lib/supabase/server";
import { originLabel, type LeadOrigin } from "./schemas";

export type LeadRow = LeadOrigin & {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  campaign: string;
  consent_at: string;
  created_at: string;
};

/** Contatos captados, do mais novo para o mais antigo. O RLS limita a owner e admin. */
export async function listLeads(limit = 500): Promise<LeadRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, name, email, phone, campaign, consent_at, created_at, utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid, referrer, landing_path",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[leads] leitura falhou:", error.message);
    return [];
  }
  return (data ?? []) as LeadRow[];
}

/** Resumo para o topo da página: novos na semana e de onde vieram. */
export function leadStats(leads: LeadRow[]) {
  const now = Date.now();
  const week = leads.filter(
    (l) => now - new Date(l.created_at).getTime() < 7 * 86_400_000,
  ).length;
  const bySource = new Map<string, number>();
  for (const l of leads) {
    const k = originLabel(l);
    bySource.set(k, (bySource.get(k) ?? 0) + 1);
  }
  const sources = [...bySource.entries()].sort((a, b) => b[1] - a[1]);
  return { week, sources };
}
