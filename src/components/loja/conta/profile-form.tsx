"use client";

import { useActionState } from "react";
import { saveProfile } from "@/modules/conta/actions";
import type { FormState } from "@/modules/conta/schemas";
import { BTN_PRIMARY, Field, FormMessage } from "./fields";

const IDLE: FormState = { status: "idle" };

export function ProfileForm({
  name,
  phone,
  marketing,
}: {
  name: string;
  phone: string | null;
  marketing: boolean;
}) {
  const [state, action, pending] = useActionState(saveProfile, IDLE);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field
        label="Seu nome"
        name="name"
        defaultValue={name}
        autoComplete="name"
        required
        state={state}
      />
      <Field
        label="WhatsApp com DDD"
        name="phone"
        type="tel"
        inputMode="numeric"
        defaultValue={phone ?? ""}
        autoComplete="tel-national"
        state={state}
      />
      <label className="text-ink-600 flex items-start gap-3 text-sm sm:col-span-2">
        <input
          type="checkbox"
          name="marketing"
          defaultChecked={marketing}
          className="accent-forest-900 mt-0.5 size-5 shrink-0"
        />
        <span>Quero receber ofertas e novidades por e-mail e WhatsApp.</span>
      </label>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button type="submit" disabled={pending} className={BTN_PRIMARY}>
          {pending ? "Salvando…" : "Salvar dados"}
        </button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
