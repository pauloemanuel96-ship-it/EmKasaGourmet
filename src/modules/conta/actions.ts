"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import {
  addressSchema,
  emailSchema,
  passwordSchema,
  profileSchema,
  signInSchema,
  signUpSchema,
  toFormError,
  type FormState,
} from "./schemas";

const str = (form: FormData, key: string) => String(form.get(key) ?? "");

/** Devolve junto o que foi digitado (menos a senha), para não apagar o formulário. */
function keep(form: FormData, state: FormState): FormState {
  if (state.status !== "error") return state;
  const values: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (
      typeof value === "string" &&
      key !== "password" &&
      !key.startsWith("$")
    ) {
      values[key] = value;
    }
  }
  return { ...state, values };
}

/** Criar conta (D-042). O e-mail de confirmação volta para /auth/callback. */
export async function signUpCustomer(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    name: str(form, "name"),
    email: str(form, "email"),
    password: str(form, "password"),
    phone: str(form, "phone"),
    marketing: form.get("marketing") === "on",
  });
  if (!parsed.success) return keep(form, toFormError(parsed.error));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/minha-casa`,
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone ?? "",
        marketing: parsed.data.marketing,
      },
    },
  });
  if (error) {
    if (error.code === "signup_disabled") {
      return {
        status: "error",
        message: "O cadastro ainda não está aberto. Volte em breve.",
      };
    }
    if (error.code === "weak_password") {
      return {
        status: "error",
        message: "Escolha uma senha mais forte.",
        fieldErrors: {
          password: ["Use letras e números, com 8 ou mais caracteres."],
        },
      };
    }
    if (error.status === 429) {
      return {
        status: "error",
        message: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
      };
    }
    console.warn("[conta] signUp:", error.status, error.code);
    return {
      status: "error",
      message: "Não deu para criar a conta agora. Tente de novo.",
    };
  }
  // Sem confirmação de e-mail ligada, a sessão já vem pronta.
  if (data.session) redirect("/minha-casa");
  // Mesma resposta para e-mail novo ou já cadastrado, para não revelar quem tem conta.
  return {
    status: "ok",
    message:
      "Enviamos um e-mail para confirmar a sua conta. Abra o link neste mesmo aparelho.",
  };
}

export async function signInCustomer(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: str(form, "email"),
    password: str(form, "password"),
  });
  if (!parsed.success) return keep(form, toFormError(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        status: "error",
        message: "Confirme a conta pelo link que enviamos ao seu e-mail.",
      };
    }
    if (error.status === 429) {
      return {
        status: "error",
        message: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
      };
    }
    return { status: "error", message: "E-mail ou senha incorretos." };
  }
  redirect("/minha-casa");
}

export async function signOutCustomer() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}

export async function requestPasswordReset(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = emailSchema.safeParse({ email: str(form, "email") });
  if (!parsed.success) return keep(form, toFormError(parsed.error));
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${siteUrl()}/auth/callback?next=/minha-casa/senha`,
    },
  );
  if (error?.status === 429) {
    return {
      status: "error",
      message: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
    };
  }
  if (error) console.warn("[conta] resetPassword:", error.status, error.code);
  return {
    status: "ok",
    message:
      "Se este e-mail tiver conta, você vai receber um link para criar uma senha nova.",
  };
}

export async function updatePassword(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = passwordSchema.safeParse({ password: str(form, "password") });
  if (!parsed.success) return keep(form, toFormError(parsed.error));
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return {
      status: "error",
      message: "O link expirou. Peça um novo em “Esqueci a senha”.",
    };
  }
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return {
      status: "error",
      message:
        error.code === "same_password"
          ? "A senha nova precisa ser diferente da atual."
          : "Não deu para trocar a senha. Tente de novo.",
    };
  }
  return { status: "ok", message: "Senha trocada." };
}

export async function saveProfile(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = profileSchema.safeParse({
    name: str(form, "name"),
    phone: str(form, "phone"),
    marketing: form.get("marketing") === "on",
  });
  if (!parsed.success) return keep(form, toFormError(parsed.error));
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId)
    return { status: "error", message: "Entre na sua conta de novo." };
  const { error } = await supabase
    .from("customers")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone,
      marketing_consent: parsed.data.marketing,
      marketing_consent_at: parsed.data.marketing
        ? new Date().toISOString()
        : null,
    })
    .eq("id", userId);
  if (error) {
    console.error("[conta] salvar dados falhou:", error.message);
    return { status: "error", message: "Não deu para salvar. Tente de novo." };
  }
  refresh();
  return { status: "ok", message: "Dados salvos." };
}

export async function saveAddress(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const id = str(form, "id");
  const parsed = addressSchema.safeParse({
    ...(id ? { id } : {}),
    label: str(form, "label"),
    recipient: str(form, "recipient"),
    cep: str(form, "cep"),
    street: str(form, "street"),
    number: str(form, "number"),
    complement: str(form, "complement"),
    district: str(form, "district"),
    city: str(form, "city"),
    state: str(form, "state"),
    reference: str(form, "reference"),
    isDefault: form.get("isDefault") === "on",
  });
  if (!parsed.success) return keep(form, toFormError(parsed.error));
  const { id: addressId, isDefault, ...fields } = parsed.data;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return { status: "error", message: "Entre na sua conta de novo." };
  }
  // customer_id vem do banco (auth.uid()); o RLS barra endereço de outra conta.
  const row = { ...fields, ...(isDefault ? { is_default: true } : {}) };
  const { error } = addressId
    ? await supabase.from("customer_addresses").update(row).eq("id", addressId)
    : await supabase.from("customer_addresses").insert(row);
  if (error) {
    const full = error.message.includes("Limite de 10");
    if (!full) console.error("[conta] salvar endereço falhou:", error.message);
    return keep(form, {
      status: "error",
      message: full
        ? "Sua conta já tem 10 endereços. Apague um para cadastrar outro."
        : "Não deu para salvar o endereço. Tente de novo.",
    });
  }
  refresh();
  return { status: "ok", message: "Endereço salvo." };
}

export async function deleteAddress(form: FormData): Promise<void> {
  const id = str(form, "id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", id);
  if (error) console.error("[conta] apagar endereço falhou:", error.message);
  refresh();
}

export async function makeDefaultAddress(form: FormData): Promise<void> {
  const id = str(form, "id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_addresses")
    .update({ is_default: true })
    .eq("id", id);
  if (error) console.error("[conta] endereço principal falhou:", error.message);
  refresh();
}
