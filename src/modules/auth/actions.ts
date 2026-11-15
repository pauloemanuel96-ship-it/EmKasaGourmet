"use server";

import { redirect } from "next/navigation";
import { siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, type LoginState } from "./schemas";

const SENT_MESSAGE =
  "Se este e-mail tiver acesso ao painel, você vai receber um link para entrar. Abra o link neste mesmo navegador.";

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "E-mail inválido.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      // O painel não aceita cadastro aberto: o usuário é criado no Supabase e recebe um papel.
      shouldCreateUser: false,
      emailRedirectTo: `${siteUrl()}/auth/callback`,
    },
  });

  // Limite de envio é o único erro que vale mostrar. Os demais recebem a mesma
  // resposta genérica, para não revelar quais e-mails têm acesso.
  if (error?.status === 429) {
    return {
      status: "error",
      message: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
    };
  }
  if (error) {
    console.warn("[auth] signInWithOtp:", error.status, error.code);
  }

  return { status: "sent", message: SENT_MESSAGE };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
