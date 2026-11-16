"use client";

import { useActionState, useState } from "react";
import {
  requestPasswordReset,
  signInCustomer,
  signUpCustomer,
} from "@/modules/conta/actions";
import type { FormState } from "@/modules/conta/schemas";
import { BTN_PRIMARY, Field, FormMessage } from "./fields";

const IDLE: FormState = { status: "idle" };
type Tab = "entrar" | "criar" | "senha";

/** Entrar, criar conta e pedir senha nova, numa tela só (D-042). */
export function AuthForms({ initial = "entrar" }: { initial?: Tab }) {
  const [tab, setTab] = useState<Tab>(initial);
  const [inState, signIn, inPending] = useActionState(signInCustomer, IDLE);
  const [upState, signUp, upPending] = useActionState(signUpCustomer, IDLE);
  const [pwState, reset, pwPending] = useActionState(
    requestPasswordReset,
    IDLE,
  );
  const tabBtn = (id: Tab, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className={`min-h-11 flex-1 rounded-full px-4 text-sm font-medium transition-colors ${tab === id ? "bg-forest-900 text-cream-50" : "text-ink-600"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="border-sand-200 bg-paper flex flex-col gap-5 rounded-(--radius-media) border p-6 sm:p-8">
      {tab !== "senha" && (
        <div role="tablist" className="bg-sand-200/70 flex rounded-full p-1">
          {tabBtn("entrar", "Entrar")}
          {tabBtn("criar", "Criar conta")}
        </div>
      )}

      {tab === "entrar" && (
        <form action={signIn} className="flex flex-col gap-4">
          <Field
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            required
            state={inState}
          />
          <Field
            label="Senha"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            state={inState}
          />
          <FormMessage state={inState} />
          <button type="submit" disabled={inPending} className={BTN_PRIMARY}>
            {inPending ? "Entrando…" : "Entrar"}
          </button>
          <button
            type="button"
            onClick={() => setTab("senha")}
            className="text-ink-600 text-sm underline underline-offset-4"
          >
            Esqueci a senha
          </button>
        </form>
      )}

      {tab === "criar" &&
        (upState.status === "ok" ? (
          <p role="status" className="text-forest-900 text-lg">
            {upState.message}
          </p>
        ) : (
          <form action={signUp} className="flex flex-col gap-4">
            <Field
              label="Seu nome"
              name="name"
              autoComplete="name"
              required
              state={upState}
            />
            <Field
              label="E-mail"
              name="email"
              type="email"
              autoComplete="email"
              required
              state={upState}
            />
            <Field
              label="WhatsApp com DDD (opcional)"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              state={upState}
            />
            <Field
              label="Crie uma senha"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              hint="Pelo menos 8 caracteres."
              state={upState}
            />
            <label className="text-ink-600 flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="marketing"
                className="accent-forest-900 mt-0.5 size-5 shrink-0"
              />
              <span>
                Quero receber ofertas e novidades da Emkasa por e-mail e
                WhatsApp. Posso sair quando quiser.
              </span>
            </label>
            <FormMessage state={upState} />
            <button type="submit" disabled={upPending} className={BTN_PRIMARY}>
              {upPending ? "Criando…" : "Criar minha conta"}
            </button>
          </form>
        ))}

      {tab === "senha" && (
        <form action={reset} className="flex flex-col gap-4">
          <h2 className="text-2xl">Criar uma senha nova</h2>
          <p className="text-ink-600 text-sm">
            Informe o e-mail da sua conta. Enviamos um link para você criar
            outra senha.
          </p>
          <Field
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            required
            state={pwState}
          />
          <FormMessage state={pwState} />
          <button type="submit" disabled={pwPending} className={BTN_PRIMARY}>
            {pwPending ? "Enviando…" : "Enviar link"}
          </button>
          <button
            type="button"
            onClick={() => setTab("entrar")}
            className="text-ink-600 text-sm underline underline-offset-4"
          >
            Voltar para entrar
          </button>
        </form>
      )}
    </div>
  );
}
