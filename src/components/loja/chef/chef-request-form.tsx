"use client";

import { useActionState, useState } from "react";
import {
  BTN_PRIMARY,
  Field,
  FormMessage,
  INPUT,
} from "@/components/loja/conta/fields";
import { requestChef } from "@/modules/chef/actions";
import {
  CHEF_CITY,
  CHEF_FORMATS,
  CHEF_HEALTH_CONSENT_TEXT,
  CHEF_PERIODS,
} from "@/modules/chef/schemas";
import type { FormState } from "@/modules/conta/schemas";

const IDLE: FormState = { status: "idle" };

function errorOf(state: FormState, name: string) {
  return state.status === "error" ? state.fieldErrors?.[name]?.[0] : undefined;
}
function keptOf(state: FormState, name: string) {
  return state.status === "error" ? state.values?.[name] : undefined;
}

/** Pedido de proposta do Chef Emkasa: a equipe responde pelo WhatsApp. */
export function ChefRequestForm() {
  const [state, action, pending] = useActionState(requestChef, IDLE);
  const [format, setFormat] = useState<string>("ocasiao");
  const [restr, setRestr] = useState("");

  if (state.status === "ok") {
    return (
      <div
        role="status"
        className="flex flex-col items-start gap-3 rounded-(--radius-media) bg-[#faf3e6] p-8 text-[#1a120c]"
      >
        <p className="text-xs font-semibold tracking-widest text-[#8a5a12] uppercase">
          Pedido enviado
        </p>
        <p className="font-serif text-2xl">{state.message}</p>
        <p className="text-sm text-[#1a120c]/70">
          Se tiver pressa, responda a mensagem que vai chegar com mais detalhes
          da sua ocasião.
        </p>
      </div>
    );
  }

  const area = (
    name: string,
    label: string,
    hint: string,
    extra: React.TextareaHTMLAttributes<HTMLTextAreaElement> = {},
  ) => {
    const err = errorOf(state, name);
    return (
      <div className="sm:col-span-2">
        <label
          htmlFor={`chef-${name}`}
          className="text-ink-900 mb-1 block text-sm font-medium"
        >
          {label}
        </label>
        <textarea
          id={`chef-${name}`}
          name={name}
          rows={3}
          defaultValue={keptOf(state, name)}
          aria-invalid={Boolean(err)}
          aria-describedby={`chef-${name}-dica`}
          className={`${INPUT} py-3`}
          {...extra}
        />
        <p
          id={`chef-${name}-dica`}
          className={`mt-1 text-xs ${err ? "text-terracotta-500" : "text-ink-600"}`}
        >
          {err ?? hint}
        </p>
      </div>
    );
  };

  return (
    <form
      action={action}
      noValidate
      className="grid gap-5 rounded-(--radius-media) bg-[#faf3e6] p-6 text-[#1a120c] sm:grid-cols-2 sm:p-8"
    >
      <fieldset className="sm:col-span-2">
        <legend className="text-ink-900 mb-2 text-sm font-medium">
          O que você quer?
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {CHEF_FORMATS.map((f) => (
            <label
              key={f.code}
              className={`flex min-h-11 cursor-pointer flex-col gap-1 rounded-(--radius-control) border p-4 text-sm transition ${format === f.code ? "border-[#8a5a12] bg-[#fed216]/20 shadow-[0_0_0_1px_#8a5a12]" : "border-sand-200 bg-paper"}`}
            >
              <span className="flex items-center gap-2 font-medium">
                <input
                  type="radio"
                  name="format"
                  value={f.code}
                  checked={format === f.code}
                  onChange={() => setFormat(f.code)}
                  className="accent-[#8a5a12]"
                />
                {f.name.replace("Chef Emkasa ", "")}
              </span>
              <span className="text-ink-600 text-xs">{f.tag}</span>
            </label>
          ))}
        </div>
        {errorOf(state, "format") && (
          <p className="text-terracotta-500 mt-1 text-sm">
            {errorOf(state, "format")}
          </p>
        )}
      </fieldset>

      <Field
        label="Data que você gostaria"
        name="desiredDate"
        type="date"
        state={state}
        hint="Opcional. A equipe confirma a agenda com você."
      />
      <div>
        <label
          htmlFor="chef-period"
          className="text-ink-900 mb-1 block text-sm font-medium"
        >
          Período
        </label>
        <select
          id="chef-period"
          name="period"
          defaultValue={keptOf(state, "period") ?? ""}
          className={INPUT}
        >
          <option value="">Tanto faz</option>
          {CHEF_PERIODS.map((p) => (
            <option key={p.code} value={p.code}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <Field
        label={`Bairro em ${CHEF_CITY}`}
        name="neighborhood"
        state={state}
        autoComplete="address-level3"
        required
      />
      <Field
        label={
          format === "ocasiao"
            ? "Quantas pessoas à mesa"
            : "Para quantas pessoas"
        }
        name="people"
        type="number"
        inputMode="numeric"
        min={1}
        max={40}
        defaultValue="2"
        state={state}
        required
      />
      {area(
        "notes",
        format === "ocasiao" ? "Conte a ocasião" : "Conte a rotina da casa",
        format === "ocasiao"
          ? "Aniversário, jantar a dois, almoço de família… e o que vocês gostam."
          : "Quantas refeições, se segue nutricionista, o que não pode faltar.",
        { maxLength: 1000 },
      )}
      {area(
        "restrictions",
        "Alergias e restrições de quem vai comer",
        "Opcional. Ex.: alergia a amendoim, sem glúten, vegano.",
        {
          maxLength: 600,
          onChange: (e) => setRestr(e.currentTarget.value),
        },
      )}
      {restr.trim() !== "" && (
        <label className="flex items-start gap-3 text-sm sm:col-span-2">
          <input
            type="checkbox"
            name="healthConsent"
            className="mt-1 size-5 accent-[#8a5a12]"
          />
          <span>
            {CHEF_HEALTH_CONSENT_TEXT}
            {errorOf(state, "healthConsent") && (
              <span className="text-terracotta-500 mt-1 block">
                {errorOf(state, "healthConsent")}
              </span>
            )}
          </span>
        </label>
      )}
      <Field
        label="Seu nome"
        name="name"
        state={state}
        autoComplete="name"
        required
      />
      <Field
        label="WhatsApp com DDD"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        state={state}
        required
      />
      <Field
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        state={state}
        hint="Opcional."
        className="sm:col-span-2"
      />
      {/* Campo-isca contra robôs: escondido de pessoas e leitores de tela. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <div className="flex flex-col gap-3 sm:col-span-2">
        <FormMessage state={state} />
        <button type="submit" disabled={pending} className={BTN_PRIMARY}>
          {pending ? "Enviando…" : "Pedir minha proposta"}
        </button>
        <p className="text-ink-600 text-xs">
          Sem compromisso. A equipe da Chef responde pelo WhatsApp com a
          proposta e o valor. Seus dados ficam só com a Emkasa.
        </p>
      </div>
    </form>
  );
}
