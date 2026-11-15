import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "owner" | "admin" | "operacao" | "atendimento";

export type CurrentUser = {
  userId: string;
  email: string | null;
  role: StaffRole | null;
};

/** Usuário logado + papel. Validado pelo JWT (getClaims), nunca só pelo cookie. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;

  const userId = data.claims.sub;
  const { data: row } = await supabase
    .from("staff_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    userId,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
    role: (row?.role as StaffRole | undefined) ?? null,
  };
});

/**
 * Exige usuário logado com um dos papéis. Sem sessão → login.
 * Sem papel permitido → retorna `{ allowed: false }` para a página mostrar "sem acesso".
 */
export async function requireStaff(
  roles: StaffRole[] = ["owner", "admin", "operacao", "atendimento"],
): Promise<
  | { allowed: true; user: CurrentUser & { role: StaffRole } }
  | { allowed: false; user: CurrentUser }
> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role && roles.includes(user.role)) {
    return { allowed: true, user: { ...user, role: user.role } };
  }
  return { allowed: false, user };
}

export const ROLE_LABEL: Record<StaffRole, string> = {
  owner: "Proprietária(o)",
  admin: "Administração",
  operacao: "Operação",
  atendimento: "Atendimento",
};
