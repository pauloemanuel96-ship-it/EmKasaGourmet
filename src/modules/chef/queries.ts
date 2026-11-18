import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ChefRequestRow = {
  id: string;
  status: string;
  format: string;
  desired_date: string | null;
  period: string | null;
  neighborhood: string;
  city: string;
  people: number;
  notes: string | null;
  restrictions: string | null;
  name: string;
  phone: string;
  email: string | null;
  user_id: string | null;
  staff_notes: string | null;
  created_at: string;
};

/** Pedidos do Chef Emkasa para o painel (owner e admin; o banco confere). */
export async function listChefRequests(): Promise<ChefRequestRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chef_requests")
    .select(
      "id, status, format, desired_date, period, neighborhood, city, people, notes, restrictions, name, phone, email, user_id, staff_notes, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[chef] lista falhou:", error.message);
    return [];
  }
  return data as ChefRequestRow[];
}
