import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Period } from "./schemas";

export { PERIODS, toPeriod, type Period } from "./schemas";

export type TrafficReport = {
  days: number;
  since: string;
  totals: {
    visitors: number;
    sessions: number;
    views: number;
    logged: number;
    leads: number;
    orders: number;
  };
  daily: { day: string; visitors: number; views: number }[];
  funnel: { step: string; sessions: number }[];
  pages: { path: string; views: number; visitors: number }[];
  sources: {
    source: string;
    medium: string | null;
    sessions: number;
    carts: number;
    conversions: number;
  }[];
  devices: { device: string; sessions: number }[];
  products: { slug: string; name: string; added: number; removed: number }[];
  abandoned: { sessions: number; logged: number };
  recent: {
    started: string;
    source: string;
    device: string | null;
    landing: string;
    views: number;
    customer: string | null;
    reached: string;
  }[];
};

/** Relatório do painel master. O banco recusa quem não é o dono. */
export async function getTrafficReport(
  days: Period,
): Promise<TrafficReport | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("traffic_report", {
    p_days: days,
  });
  if (error) {
    console.error("[trafego] relatório falhou:", error.message);
    return null;
  }
  return data as TrafficReport;
}
