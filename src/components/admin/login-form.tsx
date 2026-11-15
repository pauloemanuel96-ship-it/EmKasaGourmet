"use client";

import { useActionState } from "react";
import { sendMagicLink } from "@/modules/auth/actions";
import type { LoginState } from "@/modules/auth/schemas";

const initial: LoginState = { status: "idle" };

export function LoginForm() {
  const [state, action, pending] = useActionState(sendMagicLink, initial);

  if (state.status === "sent") {
    return (
      <p role="status" className="bg-sand-200 rounded-(--radius-control) p-4">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="font-medium">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          aria-invalid={state.status === "error"}
          aria-describedby={state.status === "error" ? "email-erro" : undefined}
          className="border-ink-600/40 bg-paper min-h-11 rounded-(--radius-control) border px-3 text-base"
        />
        {state.status === "error" && (
          <p id="email-erro" className="text-danger-600 text-sm">
            {state.message}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="bg-forest-900 text-cream-50 hover:bg-forest-700 min-h-11 rounded-(--radius-control) px-4 font-medium disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Receber link de acesso"}
      </button>
    </form>
  );
}
