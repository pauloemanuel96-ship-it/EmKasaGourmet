"use client";

import Link from "next/link";
import { useState } from "react";
import { BOX_PLANS, DELIVERY_ZONES, productBySlug } from "@/demo/data";
import { planForPeople, suggestBox } from "@/demo/logic";
import { demo, useDemo } from "@/demo/store";
import { formatCents } from "@/lib/money";
import type { BoxHousehold } from "@/modules/familia/queries";
import { HouseholdEditor } from "./household-editor";

const GROUP_LABEL: Record<string, string> = {
  folhas: "Folhas",
  raizes: "Raízes",
  legumes: "Legumes",
  frutas: "Frutas",
  ervas: "Ervas",
};

/**
 * Monta o BOX. Com login, usa a família cadastrada na Minha Casa (D-046);
 * sem login, o editor de demonstração guardado no navegador.
 */
export function BoxBuilder({ account }: { account: BoxHousehold | null }) {
  const demoMembers = useDemo((s) => s.members);
  const members = account ? account.members : demoMembers;
  const stock = useDemo((s) => s.stock);
  const subscription = useDemo((s) => s.subscription);
  const [editing, setEditing] = useState(!account && demoMembers.length === 0);
  const [planCode, setPlanCode] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<"semanal" | "quinzenal">(
    "semanal",
  );
  const [done, setDone] = useState<string | null>(null);

  const plan =
    BOX_PLANS.find((p) => p.code === planCode) ??
    planForPeople(Math.max(members.length, 1));
  const suggestion = suggestBox(plan, members, stock);

  if (editing) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl">1. Quem mora na sua casa?</h2>
        <p className="text-ink-600">
          Cada pessoa pode ter preferências diferentes. Não presumimos que todos
          comem igual.
        </p>
        <HouseholdEditor onSaved={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        {account && members.length === 0 ? (
          <div className="bg-sand-200/60 flex flex-col gap-2 rounded-(--radius-media) p-5">
            <h2 className="text-2xl">1. Quem mora na sua casa?</h2>
            <p className="text-ink-600 text-sm">
              Cadastre as pessoas da casa na Minha Casa e o BOX passa a tirar o
              que alguém não pode ou não gosta de comer. Enquanto isso, a
              sugestão abaixo é para uma pessoa, sem restrições.
            </p>
            <Link
              href="/minha-casa"
              className="bg-forest-900 text-cream-50 inline-flex min-h-11 items-center self-start rounded-full px-5 text-sm font-medium"
            >
              Cadastrar minha família
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl">Sua casa: {members.length} pessoa(s)</h2>
            {account ? (
              <Link
                href="/minha-casa"
                className="text-forest-900 inline-flex min-h-11 items-center text-sm font-medium underline"
              >
                Editar na Minha Casa
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-forest-900 min-h-11 text-sm font-medium underline"
              >
                Editar perfis
              </button>
            )}
          </div>
        )}
        {account && members.length > 0 && (
          <>
            <ul aria-label="Pessoas da casa" className="flex flex-wrap gap-2">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="bg-sand-200/70 text-forest-900 rounded-full px-3 py-1 text-sm"
                >
                  {m.nickname}
                </li>
              ))}
            </ul>
            <p className="text-ink-600 text-sm">
              {account.healthConsent
                ? "O BOX confere alergias, dieta e o que cada um não gosta, pela ficha de cada item."
                : "Sem a autorização de saúde na Minha Casa, o BOX confere só o que cada um não gosta; alergias e dieta ficam de fora."}
            </p>
          </>
        )}
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label="Plano"
        >
          {BOX_PLANS.map((p) => (
            <button
              key={p.code}
              type="button"
              role="radio"
              aria-checked={plan.code === p.code}
              onClick={() => setPlanCode(p.code)}
              className="border-forest-900/40 aria-checked:bg-forest-900 aria-checked:text-cream-50 min-h-11 rounded-(--radius-control) border px-4 text-sm"
            >
              {p.name} · {formatCents(p.priceCents)}
            </button>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="sugestao"
        className="grid gap-8 md:grid-cols-[1fr_300px]"
      >
        <div className="flex flex-col gap-4">
          <h2 id="sugestao" className="text-2xl">
            2. O {plan.name} desta semana
          </h2>
          <p className="text-ink-600 text-sm">
            Montado cruzando o seu perfil com o estoque real de hoje.
          </p>
          <ul className="divide-sand-200 bg-paper divide-y rounded-(--radius-media)">
            {suggestion.items.map((i) => {
              const p = productBySlug(i.slug)!;
              return (
                <li
                  key={i.slug}
                  className="flex justify-between gap-3 p-4 text-sm"
                >
                  <span>
                    {i.quantity}× {p.name}{" "}
                    <span className="text-ink-600">({p.unitLabel})</span>
                  </span>
                  <span className="text-ink-600">
                    {GROUP_LABEL[p.boxGroup ?? ""]}
                  </span>
                </li>
              );
            })}
          </ul>
          {suggestion.missing.length > 0 && (
            <p className="bg-warning-600/5 text-warning-600 rounded-(--radius-control) p-4 text-sm">
              Faltou:{" "}
              {suggestion.missing
                .map((m) => `${GROUP_LABEL[m.group]} (${m.got}/${m.wanted})`)
                .join(", ")}
              . Na versão real, a equipe completa com substituições permitidas.
            </p>
          )}
          {suggestion.excluded.length > 0 && (
            <details className="text-sm">
              <summary className="text-ink-600 cursor-pointer">
                Por que alguns itens ficaram de fora (
                {suggestion.excluded.length})
              </summary>
              <ul className="mt-2 flex flex-col gap-1">
                {suggestion.excluded.map((e) => (
                  <li key={e.slug} className="text-ink-600">
                    {productBySlug(e.slug)?.name}: {e.why}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        <aside className="bg-sand-200/60 flex h-fit flex-col gap-4 rounded-(--radius-media) p-5">
          <p className="text-forest-900 font-serif text-xl">
            Como você quer receber?
          </p>
          <button
            type="button"
            onClick={() => {
              demo.addBoxToCart(suggestion.items);
              setDone("avulso");
            }}
            className="border-forest-900 text-forest-900 min-h-11 rounded-(--radius-control) border px-4 text-sm font-medium"
          >
            Comprar uma vez (itens no carrinho)
          </button>
          <div className="border-sand-200 flex flex-col gap-2 border-t pt-4">
            <p className="text-sm font-medium">Assinar</p>
            <select
              value={frequency}
              onChange={(e) =>
                setFrequency(e.target.value as "semanal" | "quinzenal")
              }
              className="border-ink-600/30 bg-paper min-h-11 rounded-(--radius-control) border px-3 text-sm"
            >
              <option value="semanal">Toda semana</option>
              <option value="quinzenal">A cada 15 dias</option>
            </select>
            <button
              type="button"
              onClick={() => {
                demo.subscribe({
                  planCode: plan.code,
                  frequency,
                  items: suggestion.items,
                  nextDate: null,
                  zoneId: DELIVERY_ZONES[0].id,
                });
                setDone("assinatura");
              }}
              className="bg-forest-900 text-cream-50 min-h-11 rounded-(--radius-control) px-4 text-sm font-medium"
            >
              {subscription
                ? "Trocar minha assinatura"
                : `Assinar por ${formatCents(plan.priceCents)}/entrega`}
            </button>
          </div>
          {done === "avulso" && (
            <p role="status" className="text-forest-700 text-sm">
              Itens no carrinho.{" "}
              <Link href="/carrinho" className="underline">
                Ver carrinho
              </Link>
            </p>
          )}
          {done === "assinatura" && (
            <p role="status" className="text-forest-700 text-sm">
              Assinatura criada (simulada).{" "}
              <Link href="/minha-casa" className="underline">
                Gerenciar na Minha Casa
              </Link>
            </p>
          )}
        </aside>
      </section>
    </div>
  );
}
