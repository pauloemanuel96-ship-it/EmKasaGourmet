"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updatePassword } from "@/modules/conta/actions";
import type { FormState } from "@/modules/conta/schemas";
import { BTN_PRIMARY, Field, FormMessage } from "./fields";

const IDLE: FormState = { status: "idle" };

export function PasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, IDLE);
  if (state.status === "ok") {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="text-forest-900 text-lg">
          Senha trocada.
        </p>
        <Link href="/minha-casa" className={BTN_PRIMARY}>
          Ir para Minha Casa
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field
        label="Senha nova"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        hint="Pelo menos 8 caracteres."
        state={state}
      />
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={BTN_PRIMARY}>
        {pending ? "Salvando…" : "Salvar senha nova"}
      </button>
    </form>
  );
}
