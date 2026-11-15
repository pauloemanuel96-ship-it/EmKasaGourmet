"use client";

import Link from "next/link";
import { useState } from "react";
import { productBySlug } from "@/demo/data";
import { suggestBox } from "@/demo/logic";
import { STATUS_LABEL, demo, planName, useDemo } from "@/demo/store";
import { BOX_PLANS } from "@/demo/data";
import { formatCents } from "@/lib/money";
import { HouseholdEditor } from "./household-editor";

export function MyHome() {
  const s = useDemo((x) => x);
  const [editing, setEditing] = useState(false);
  const sub = s.subscription;
  const plan = sub ? BOX_PLANS.find((p) => p.code === sub.planCode)! : null;
  const nextBox = plan ? suggestBox(plan, s.members, s.stock) : null;

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <section aria-labelledby="casa" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 id="casa" className="text-2xl">
            Minha casa
          </h2>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="min-h-11 text-sm underline"
            >
              Editar
            </button>
          )}
        </div>
        {editing ? (
          <HouseholdEditor onSaved={() => setEditing(false)} />
        ) : s.members.length === 0 ? (
          <p className="text-ink-600">
            Você ainda não cadastrou a sua casa.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => setEditing(true)}
            >
              Cadastrar agora
            </button>
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {s.members.map((m) => (
              <li
                key={m.id}
                className="rounded-(--radius-control) bg-white p-4 text-sm"
              >
                <p className="font-medium">{m.nickname}</p>
                <p className="text-ink-600">
                  {m.diet === "sem_restricao" ? "Sem restrição" : m.diet}
                  {m.allergies.length
                    ? ` · Alergias: ${m.allergies.length}`
                    : ""}
                  {m.dislikes.length
                    ? ` · Não gosta: ${m.dislikes.length}`
                    : ""}
                </p>
              </li>
            ))}
            {s.healthConsent && (
              <li className="text-ink-600 text-xs">
                Consentimento para dados de saúde: concedido.{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() =>
                    demo.setHousehold(
                      s.members.map((m) => ({ ...m, allergies: [] })),
                      false,
                    )
                  }
                >
                  Apagar alergias
                </button>
              </li>
            )}
          </ul>
        )}
      </section>

      <section aria-labelledby="assinatura" className="flex flex-col gap-4">
        <h2 id="assinatura" className="text-2xl">
          Assinatura
        </h2>
        {!sub || sub.status === "cancelada" ? (
          <p className="text-ink-600">
            Nenhuma assinatura ativa.{" "}
            <Link href="/box" className="underline">
              Montar meu BOX
            </Link>
          </p>
        ) : (
          <div className="flex flex-col gap-4 rounded-(--radius-media) bg-white p-5 text-sm">
            <p className="text-forest-900 font-serif text-xl">
              {planName(sub.planCode)} · {sub.frequency}
            </p>
            <p>
              Status:{" "}
              <strong>{sub.status === "ativa" ? "Ativa" : "Pausada"}</strong> ·{" "}
              {formatCents(plan!.priceCents)}/entrega
            </p>
            {sub.status === "ativa" && nextBox && (
              <div>
                <p className="mb-1 font-medium">
                  Próxima cesta (com o estoque de hoje)
                </p>
                <ul className="text-ink-600">
                  {nextBox.items.map((i) => (
                    <li key={i.slug}>
                      {i.quantity}× {productBySlug(i.slug)?.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {sub.status === "ativa" ? (
                <button
                  type="button"
                  onClick={() => demo.setSubscriptionStatus("pausada")}
                  className="border-forest-900 min-h-11 rounded-(--radius-control) border px-4"
                >
                  Pausar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => demo.setSubscriptionStatus("ativa")}
                  className="bg-forest-900 text-cream-50 min-h-11 rounded-(--radius-control) px-4"
                >
                  Retomar
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  demo.setSubscriptionFrequency(
                    sub.frequency === "semanal" ? "quinzenal" : "semanal",
                  )
                }
                className="border-forest-900 min-h-11 rounded-(--radius-control) border px-4"
              >
                Mudar para{" "}
                {sub.frequency === "semanal" ? "quinzenal" : "semanal"}
              </button>
              <Link
                href="/box"
                className="border-forest-900 flex min-h-11 items-center rounded-(--radius-control) border px-4"
              >
                Alterar composição
              </Link>
              <button
                type="button"
                onClick={() => demo.setSubscriptionStatus("cancelada")}
                className="text-danger-600 min-h-11 px-2 underline"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      <section
        aria-labelledby="pedidos"
        className="flex flex-col gap-4 md:col-span-2"
      >
        <h2 id="pedidos" className="text-2xl">
          Meus pedidos
        </h2>
        {s.orders.length === 0 ? (
          <p className="text-ink-600">Nenhum pedido ainda.</p>
        ) : (
          <ul className="divide-sand-200 divide-y rounded-(--radius-media) bg-white">
            {s.orders.map((o) => (
              <li key={o.number}>
                <Link
                  href={`/pedido/${o.number}`}
                  className="hover:bg-sand-200/40 flex flex-wrap justify-between gap-2 p-4 text-sm"
                >
                  <span className="font-medium">{o.number}</span>
                  <span>{STATUS_LABEL[o.status]}</span>
                  <span>{formatCents(o.totalCents)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm">
          Pontos no Clube: <strong>{s.points}</strong> ·{" "}
          <Link href="/clube" className="underline">
            Ver benefícios
          </Link>
        </p>
      </section>
    </div>
  );
}
