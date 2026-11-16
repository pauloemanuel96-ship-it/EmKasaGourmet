import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CustomerAddress = {
  id: string;
  label: string;
  recipient: string | null;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  reference: string | null;
  is_default: boolean;
};

export type CustomerAccount = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  marketing_consent: boolean;
  addresses: CustomerAddress[];
};

/**
 * Conta de quem está logado, ou null. Na primeira vez depois de confirmar o
 * e-mail, a linha da conta é criada com o nome e o celular informados no
 * cadastro. O RLS garante que cada pessoa só alcança o que é dela.
 */
export const getCustomerAccount = cache(
  async (): Promise<CustomerAccount | null> => {
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    const userId = claims?.claims?.sub;
    if (!userId) return null;

    const fields = "id, name, email, phone, marketing_consent";
    let { data: customer } = await supabase
      .from("customers")
      .select(fields)
      .eq("id", userId)
      .maybeSingle();

    if (!customer) {
      const meta = (claims.claims.user_metadata ?? {}) as Record<
        string,
        unknown
      >;
      const email =
        typeof claims.claims.email === "string" ? claims.claims.email : "";
      const rawName = typeof meta.name === "string" ? meta.name.trim() : "";
      const rawPhone = typeof meta.phone === "string" ? meta.phone : "";
      const { data: created, error } = await supabase
        .from("customers")
        .insert({
          id: userId,
          name:
            rawName.length >= 2
              ? rawName.slice(0, 80)
              : email.split("@")[0] || "Cliente",
          email,
          phone: /^[0-9]{10,13}$/.test(rawPhone) ? rawPhone : null,
          marketing_consent: meta.marketing === true,
        })
        .select(fields)
        .maybeSingle();
      if (error) {
        console.error("[conta] criar conta falhou:", error.message);
        return null;
      }
      customer = created;
    }
    if (!customer) return null;

    const { data: addresses } = await supabase
      .from("customer_addresses")
      .select(
        "id, label, recipient, cep, street, number, complement, district, city, state, reference, is_default",
      )
      .eq("customer_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });

    return { ...customer, addresses: (addresses ?? []) as CustomerAddress[] };
  },
);

export type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  marketing_consent: boolean;
  created_at: string;
  addresses: { city: string; state: string; is_default: boolean }[];
};

/** Lista para o painel. O RLS só devolve linhas para owner e admin. */
export async function listCustomers(limit = 500): Promise<CustomerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, name, email, phone, marketing_consent, created_at, addresses:customer_addresses(city, state, is_default)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[conta] listar clientes falhou:", error.message);
    return [];
  }
  return (data ?? []) as CustomerRow[];
}
