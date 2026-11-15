"use client";

import { useState } from "react";
import {
  ALLERGEN_LABEL,
  DIET_LABEL,
  PRODUCTS,
  type AllergenCode,
  type DietLabel,
} from "@/demo/data";
import type { Member } from "@/demo/logic";
import { demo, useDemo } from "@/demo/store";

const ALLERGENS = Object.keys(ALLERGEN_LABEL) as AllergenCode[];
const HORTA = PRODUCTS.filter((p) => p.unit === "horta");

let idCounter = 0;

function emptyMember(i: number): Member {
  return {
    id: `pessoa-${i}-${idCounter++}`,
    nickname: `Pessoa ${i}`,
    allergies: [],
    diet: "sem_restricao",
    dislikes: [],
  };
}

/** Perfil da casa. Alergias = dado de saúde: só salva com consentimento (LGPD art. 11). */
export function HouseholdEditor({ onSaved }: { onSaved?: () => void }) {
  const saved = useDemo((s) => s.members);
  const savedConsent = useDemo((s) => s.healthConsent);
  const [members, setMembers] = useState<Member[]>(
    saved.length ? saved : [emptyMember(1)],
  );
  const [consent, setConsent] = useState(savedConsent);
  const [error, setError] = useState<string | null>(null);

  const hasHealthData = members.some((m) => m.allergies.length > 0);

  function patch(id: string, p: Partial<Member>) {
    setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, ...p } : m)));
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-4">
        {members.map((m, idx) => (
          <li
            key={m.id}
            className="border-sand-200 flex flex-col gap-4 rounded-(--radius-media) border bg-white p-5"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium">
                Apelido
                <input
                  value={m.nickname}
                  onChange={(e) => patch(m.id, { nickname: e.target.value })}
                  className="border-ink-600/30 min-h-11 rounded-(--radius-control) border px-3 text-base font-normal"
                />
              </label>
              {members.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setMembers((ms) => ms.filter((x) => x.id !== m.id))
                  }
                  className="text-danger-600 min-h-11 text-sm underline"
                >
                  Remover
                </button>
              )}
            </div>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Alimentação
              <select
                value={m.diet}
                onChange={(e) =>
                  patch(m.id, { diet: e.target.value as Member["diet"] })
                }
                className="border-ink-600/30 min-h-11 rounded-(--radius-control) border bg-white px-3 text-base font-normal"
              >
                <option value="sem_restricao">Sem restrição</option>
                {(Object.keys(DIET_LABEL) as DietLabel[]).map((d) => (
                  <option key={d} value={d}>
                    {DIET_LABEL[d]}
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">
                Alergias declaradas
              </legend>
              <div className="flex flex-wrap gap-2">
                {ALLERGENS.map((a) => {
                  const on = m.allergies.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        patch(m.id, {
                          allergies: on
                            ? m.allergies.filter((x) => x !== a)
                            : [...m.allergies, a],
                        })
                      }
                      className="border-ink-600/30 aria-pressed:border-danger-600 aria-pressed:bg-danger-600/10 aria-pressed:text-danger-600 min-h-9 rounded-full border px-3 text-sm"
                    >
                      {ALLERGEN_LABEL[a]}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Não gosta de</legend>
              <div className="flex flex-wrap gap-2">
                {HORTA.map((p) => {
                  const on = m.dislikes.includes(p.slug);
                  return (
                    <button
                      key={p.slug}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        patch(m.id, {
                          dislikes: on
                            ? m.dislikes.filter((x) => x !== p.slug)
                            : [...m.dislikes, p.slug],
                        })
                      }
                      className="border-ink-600/30 aria-pressed:bg-sand-200 min-h-9 rounded-full border px-3 text-sm aria-pressed:line-through"
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <p className="sr-only">Pessoa {idx + 1}</p>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setMembers((ms) => [...ms, emptyMember(ms.length + 1)])}
        className="border-forest-900 text-forest-900 min-h-11 self-start rounded-(--radius-control) border px-4 text-sm font-medium"
      >
        + Adicionar pessoa
      </button>

      {hasHealthData && (
        <label className="bg-sand-200/60 flex items-start gap-3 rounded-(--radius-control) p-4 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1"
          />
          <span>
            Autorizo a Emkasa a usar as alergias informadas{" "}
            <strong>apenas</strong> para filtrar produtos e montar minhas
            cestas. Posso apagar esses dados quando quiser.{" "}
            <span className="text-ink-600">(Dado de saúde: LGPD art. 11)</span>
          </span>
        </label>
      )}
      <p className="text-ink-600 text-xs">
        Os bloqueios seguem a ficha técnica de cada produto, incluindo
        &quot;pode conter&quot;. Em caso de alergia grave, fale com a equipe
        antes de comprar.
      </p>
      {error && (
        <p role="alert" className="text-danger-600 text-sm">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          if (hasHealthData && !consent)
            return setError(
              "Para salvar alergias, precisamos da sua autorização.",
            );
          setError(null);
          demo.setHousehold(members, hasHealthData ? consent : false);
          onSaved?.();
        }}
        className="bg-forest-900 text-cream-50 hover:bg-forest-700 min-h-11 self-start rounded-(--radius-control) px-6 font-medium"
      >
        Salvar minha casa
      </button>
    </div>
  );
}
