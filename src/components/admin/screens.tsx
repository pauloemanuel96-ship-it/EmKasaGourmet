"use client";

import { useState } from "react";
import { PRODUCTS, UNIT_LABEL } from "@/demo/data";
import {
  interpret,
  type AssistantProposal,
  type AssistantResult,
} from "@/demo/logic";
import { STATUS_LABEL, demo, useDemo, type OrderStatus } from "@/demo/store";
import { formatCents } from "@/lib/money";

/** Tela "Hoje": disponibilidade e estoque com um toque, no celular (RF-A02). */
export function TodayList() {
  const stock = useDemo((s) => s.stock);
  const tracked = PRODUCTS.filter((p) => !p.madeToOrder);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl">Hoje</h1>
      {(["horta", "cozinha", "produtos"] as const).map((u) => (
        <section key={u} aria-labelledby={`h-${u}`}>
          <h2 id={`h-${u}`} className="mb-2 text-xl">
            {UNIT_LABEL[u]}
          </h2>
          <ul className="divide-sand-200 divide-y rounded-(--radius-media) bg-white">
            {tracked
              .filter((p) => p.unit === u)
              .map((p) => {
                const q = stock[p.slug] ?? 0;
                return (
                  <li
                    key={p.slug}
                    className="flex items-center justify-between gap-2 p-3"
                  >
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="h-8 w-8 rounded"
                        style={{ backgroundColor: p.tone }}
                      />
                      <span>
                        <span className="block text-sm font-medium">
                          {p.name}
                        </span>
                        <span
                          className={`text-xs ${q === 0 ? "text-danger-600" : "text-ink-600"}`}
                        >
                          {q === 0 ? "Esgotado" : `${q} ${p.unitLabel}`}
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Menos ${p.name}`}
                        disabled={q === 0}
                        onClick={() =>
                          demo.adjustStock(p.slug, -1, "ajuste rápido")
                        }
                        className="border-ink-600/30 min-h-11 min-w-11 rounded-(--radius-control) border disabled:opacity-30"
                      >
                        –
                      </button>
                      <button
                        type="button"
                        aria-label={`Mais ${p.name}`}
                        onClick={() =>
                          demo.adjustStock(p.slug, 1, "entrada rápida")
                        }
                        className="border-ink-600/30 min-h-11 min-w-11 rounded-(--radius-control) border"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        disabled={q === 0}
                        onClick={() => demo.setStock(p.slug, 0, "acabou")}
                        className="text-danger-600 min-h-11 rounded-(--radius-control) px-2 text-xs underline disabled:opacity-30"
                      >
                        Acabou
                      </button>
                    </span>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pago: "em_preparo",
  em_preparo: "saiu_para_entrega",
  saiu_para_entrega: "entregue",
};

export function OrdersBoard() {
  const orders = useDemo((s) => s.orders);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl">Pedidos</h1>
      {orders.length === 0 && (
        <p className="text-ink-600">
          Nenhum pedido. Faça um na loja para ver o fluxo.
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {orders.map((o) => (
          <li
            key={o.number}
            className="flex flex-col gap-2 rounded-(--radius-media) bg-white p-4 text-sm"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-medium">
                {o.number} · {o.customer.name}
              </span>
              <span>
                {STATUS_LABEL[o.status]} · {formatCents(o.totalCents)}
              </span>
            </div>
            <p className="text-ink-600">
              Entrega {o.deliveryDate.split("-").reverse().join("/")} ·{" "}
              {o.lines.map((l) => `${l.quantity}× ${l.name}`).join(", ")}
            </p>
            <div className="flex flex-wrap gap-2">
              {NEXT[o.status] && (
                <button
                  type="button"
                  onClick={() => demo.setOrderStatus(o.number, NEXT[o.status]!)}
                  className="bg-forest-900 text-cream-50 min-h-11 rounded-(--radius-control) px-4"
                >
                  Marcar: {STATUS_LABEL[NEXT[o.status]!]}
                </button>
              )}
              {o.status !== "cancelado" && o.status !== "entregue" && (
                <button
                  type="button"
                  onClick={() => demo.setOrderStatus(o.number, "cancelado")}
                  className="text-danger-600 min-h-11 px-2 underline"
                >
                  Cancelar e devolver estoque
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Msg = {
  from: "chef" | "assistente";
  text: string;
  proposal?: AssistantProposal;
  state?: "pendente" | "feito" | "descartado";
};

function execute(p: AssistantProposal) {
  const who = "Chef (assistente)";
  switch (p.kind) {
    case "set_stock":
      return demo.setStock(p.slug, p.quantity, "assistente", who, "assistente");
    case "add_stock":
      return demo.adjustStock(
        p.slug,
        p.quantity,
        "assistente",
        who,
        "assistente",
      );
    case "block_date":
      return demo.blockDate(p.iso, who, "assistente");
    case "draft_product":
      return demo.createDraft(p.name, who, "assistente");
    case "set_available_list":
      for (const slug of p.slugs)
        demo.adjustStock(slug, 1, "disponível hoje", who, "assistente");
  }
}

/** Assistente operacional: interpreta → propõe → confirma → executa → registra. Regras agora; IA na Fase 3. */
export function AssistantChat() {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: "assistente",
      text: 'Oi, Chef! Me conte como está a cozinha e a horta. Ex.: "Acabou o tomate", "Chegaram 10 alfaces", "Temos 8 Farofas Nutritivas", "Amanhã não haverá entrega".',
    },
  ]);
  const [text, setText] = useState("");

  function send() {
    const t = text.trim();
    if (!t) return;
    setText("");
    const r: AssistantResult = interpret(t, new Date());
    const reply: Msg =
      r.type === "proposal"
        ? r.needsConfirmation
          ? {
              from: "assistente",
              text: `Vou fazer isto: ${r.proposal.summary}`,
              proposal: r.proposal,
              state: "pendente",
            }
          : (execute(r.proposal),
            {
              from: "assistente",
              text: `Feito: ${r.proposal.summary}`,
              state: "feito",
            })
        : r.type === "ambiguous"
          ? {
              from: "assistente",
              text: `${r.message} ${r.options.join(" / ")}`,
            }
          : { from: "assistente", text: r.message };
    setMsgs((m) => [...m, { from: "chef", text: t }, reply]);
  }

  function decide(i: number, ok: boolean) {
    setMsgs((m) =>
      m.map((x, j) => {
        if (j !== i || !x.proposal) return x;
        if (ok) execute(x.proposal);
        return { ...x, state: ok ? "feito" : "descartado" };
      }),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl">Assistente</h1>
      <ul className="flex flex-col gap-3" aria-live="polite">
        {msgs.map((m, i) => (
          <li
            key={i}
            className={`max-w-[85%] rounded-(--radius-media) p-3 text-sm ${m.from === "chef" ? "bg-forest-900 text-cream-50 self-end" : "bg-white"}`}
          >
            <p>{m.text}</p>
            {m.proposal && m.state === "pendente" && (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => decide(i, true)}
                  className="bg-forest-900 text-cream-50 min-h-11 rounded-(--radius-control) px-4"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => decide(i, false)}
                  className="border-ink-600/30 min-h-11 rounded-(--radius-control) border px-4"
                >
                  Descartar
                </button>
              </div>
            )}
            {m.state === "feito" && m.proposal && (
              <p className="text-forest-700 mt-1 text-xs">
                ✓ Registrado no histórico
              </p>
            )}
            {m.state === "descartado" && (
              <p className="text-ink-600 mt-1 text-xs">Descartado</p>
            )}
          </li>
        ))}
      </ul>
      <form action={send} className="sticky bottom-2 flex gap-2">
        <label htmlFor="msg" className="sr-only">
          Mensagem
        </label>
        <input
          id="msg"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva como falaria no WhatsApp…"
          className="border-ink-600/30 min-h-11 flex-1 rounded-(--radius-control) border bg-white px-3"
        />
        <button
          type="submit"
          className="bg-forest-900 text-cream-50 min-h-11 rounded-(--radius-control) px-5 font-medium"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
