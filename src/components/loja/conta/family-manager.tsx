"use client";

import { useActionState, useEffect, useState } from "react";
import {
  deleteMember,
  revokeHealthConsent,
  saveMember,
} from "@/modules/familia/actions";
import type { Household, HouseholdMember } from "@/modules/familia/queries";
import {
  ageFrom,
  DIETS,
  HEALTH_CONSENT_TEXT,
  type Diet,
} from "@/modules/familia/schemas";
import type { FormState } from "@/modules/conta/schemas";
import { BTN_GHOST, BTN_PRIMARY, Field, FormMessage, INPUT } from "./fields";

const IDLE: FormState = { status: "idle" };

/**
 * Pessoas da casa (D-043): quem é, o que gosta, o que evita e o que não pode.
 * Alergia, dieta e objetivo são dado de saúde: só o dono da conta vê, e só
 * ficam guardados com autorização, que pode ser retirada aqui mesmo.
 */
export function FamilyManager({ household }: { household: Household }) {
  const [editing, setEditing] = useState<HouseholdMember | "novo" | null>(null);
  const { members, healthConsent, allergens } = household;
  const allergenName = (code: string) =>
    allergens.find((a) => a.code === code)?.name ?? code;

  return (
    <div className="flex flex-col gap-4">
      {members.length === 0 && editing === null && (
        <p className="text-ink-600">
          Cadastre quem mora com você. Assim dá para avisar quando um produto
          não serve para alguém da casa.
        </p>
      )}
      <ul className="grid gap-3 sm:grid-cols-2">
        {members.map((m) => {
          const age = ageFrom(m.birth_year);
          return (
            <li
              key={m.id}
              className="border-sand-200 bg-paper flex flex-col gap-2 rounded-(--radius-media) border p-4"
            >
              <p className="text-forest-900 font-serif text-xl">
                {m.name}
                <span className="text-ink-600 font-sans text-sm font-normal">
                  {m.relation ? ` · ${m.relation}` : ""}
                  {age !== null
                    ? ` · ${age} ${age === 1 ? "ano" : "anos"}`
                    : ""}
                </span>
              </p>
              <dl className="text-ink-600 flex flex-col gap-1 text-sm">
                {m.diet !== "sem_restricao" && (
                  <div>
                    <dt className="inline font-medium">Dieta: </dt>
                    <dd className="inline">{DIETS[m.diet]}</dd>
                  </div>
                )}
                {m.allergies.length > 0 && (
                  <div>
                    <dt className="text-terracotta-500 inline font-medium">
                      Não pode:{" "}
                    </dt>
                    <dd className="inline">
                      {m.allergies.map(allergenName).join(", ")}
                    </dd>
                  </div>
                )}
                {m.likes.length > 0 && (
                  <div>
                    <dt className="inline font-medium">Gosta: </dt>
                    <dd className="inline">{m.likes.join(", ")}</dd>
                  </div>
                )}
                {m.dislikes.length > 0 && (
                  <div>
                    <dt className="inline font-medium">Não gosta: </dt>
                    <dd className="inline">{m.dislikes.join(", ")}</dd>
                  </div>
                )}
                {m.goal && (
                  <div>
                    <dt className="inline font-medium">Objetivo: </dt>
                    <dd className="inline">{m.goal}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-1 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(m)}
                  className={BTN_GHOST}
                >
                  Alterar
                </button>
                <details className="text-sm">
                  <summary className="text-ink-600 flex min-h-11 cursor-pointer items-center px-2 underline">
                    Apagar
                  </summary>
                  <form action={deleteMember}>
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      className="bg-terracotta-500 min-h-10 rounded-full px-4 font-medium text-white"
                    >
                      Apagar {m.name}
                    </button>
                  </form>
                </details>
              </div>
            </li>
          );
        })}
      </ul>

      {editing === null ? (
        members.length < 12 && (
          <div>
            <button
              type="button"
              onClick={() => setEditing("novo")}
              className={BTN_PRIMARY}
            >
              Cadastrar pessoa
            </button>
          </div>
        )
      ) : (
        <MemberForm
          key={editing === "novo" ? "novo" : editing.id}
          member={editing === "novo" ? null : editing}
          allergens={allergens}
          healthConsent={healthConsent}
          onDone={() => setEditing(null)}
        />
      )}

      {healthConsent && (
        <details className="text-ink-600 text-sm">
          <summary className="cursor-pointer underline underline-offset-4">
            Dados de saúde: autorização ativa
          </summary>
          <div className="border-sand-200 mt-3 flex flex-col gap-3 rounded-(--radius-media) border p-4">
            <p>
              Você autorizou guardar alergias, dieta e objetivo das pessoas da
              casa. Só você vê esses dados. Se retirar a autorização, eles são
              apagados na hora; nomes e gostos continuam.
            </p>
            <form action={revokeHealthConsent}>
              <button
                type="submit"
                className="bg-terracotta-500 min-h-10 rounded-full px-4 font-medium text-white"
              >
                Retirar a autorização e apagar esses dados
              </button>
            </form>
          </div>
        </details>
      )}
    </div>
  );
}

function MemberForm({
  member,
  allergens,
  healthConsent,
  onDone,
}: {
  member: HouseholdMember | null;
  allergens: Household["allergens"];
  healthConsent: boolean;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(saveMember, IDLE);
  const kept = state.status === "error" ? state.values : undefined;
  const consentError =
    state.status === "error"
      ? state.fieldErrors?.healthConsent?.[0]
      : undefined;

  useEffect(() => {
    if (state.status === "ok") onDone();
  }, [state.status, onDone]);

  return (
    <form
      action={action}
      className="border-sand-200 bg-paper grid gap-4 rounded-(--radius-media) border p-5 sm:grid-cols-6"
    >
      <h3 className="text-2xl sm:col-span-6">
        {member ? `Alterar ${member.name}` : "Nova pessoa da casa"}
      </h3>
      {member && <input type="hidden" name="id" value={member.id} />}
      <Field
        className="sm:col-span-3"
        label="Nome ou apelido"
        name="name"
        defaultValue={member?.name ?? ""}
        required
        state={state}
      />
      <Field
        className="sm:col-span-2"
        label="Quem é (opcional)"
        name="relation"
        defaultValue={member?.relation ?? ""}
        placeholder="eu, filho, mãe…"
        state={state}
      />
      <Field
        className="sm:col-span-1"
        label="Nasceu em"
        name="birthYear"
        inputMode="numeric"
        defaultValue={member?.birth_year ? String(member.birth_year) : ""}
        placeholder="ano"
        state={state}
      />
      <Field
        className="sm:col-span-3"
        label="Gosta de (opcional)"
        name="likes"
        defaultValue={member?.likes.join(", ") ?? ""}
        hint="Separe por vírgula: banana, abóbora, feijão."
        state={state}
      />
      <Field
        className="sm:col-span-3"
        label="Não gosta de (opcional)"
        name="dislikes"
        defaultValue={member?.dislikes.join(", ") ?? ""}
        hint="Separe por vírgula."
        state={state}
      />

      <fieldset className="border-sand-200 flex flex-col gap-4 rounded-(--radius-media) border p-4 sm:col-span-6">
        <legend className="text-forest-900 px-2 text-sm font-medium">
          Saúde e alimentação (opcional)
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="campo-diet"
              className="text-ink-900 mb-1 block text-sm font-medium"
            >
              Dieta
            </label>
            <select
              id="campo-diet"
              name="diet"
              defaultValue={
                (kept?.diet as Diet | undefined) ??
                member?.diet ??
                "sem_restricao"
              }
              className={INPUT}
            >
              {Object.entries(DIETS).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <Field
            label="Objetivo (opcional)"
            name="goal"
            defaultValue={member?.goal ?? ""}
            placeholder="comer mais verduras, menos açúcar…"
            state={state}
          />
        </div>
        <div>
          <p className="text-ink-900 mb-2 text-sm font-medium">
            Não pode comer (alergia ou intolerância)
          </p>
          <ul className="flex flex-wrap gap-2">
            {allergens.map((a) => (
              <li key={a.code}>
                <label className="border-sand-200 has-checked:bg-terracotta-500 has-checked:border-terracotta-500 flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm has-checked:text-white">
                  <input
                    type="checkbox"
                    name="allergies"
                    value={a.code}
                    defaultChecked={member?.allergies.includes(a.code)}
                    className="sr-only"
                  />
                  {a.name}
                </label>
              </li>
            ))}
          </ul>
        </div>
        {!healthConsent && (
          <div>
            <label className="text-ink-600 flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="healthConsent"
                className="accent-forest-900 mt-0.5 size-5 shrink-0"
              />
              <span>{HEALTH_CONSENT_TEXT}</span>
            </label>
            {consentError && (
              <p className="text-terracotta-500 mt-1 text-sm">{consentError}</p>
            )}
            <p className="text-ink-600 mt-2 text-xs">
              Só precisa marcar se preencher dieta, objetivo ou algo que a
              pessoa não pode comer. Esses dados só você vê.
            </p>
          </div>
        )}
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-6">
        <button type="submit" disabled={pending} className={BTN_PRIMARY}>
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" onClick={onDone} className={BTN_GHOST}>
          Cancelar
        </button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
