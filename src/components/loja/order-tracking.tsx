"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DELIVERY_ZONES } from "@/demo/data";
import { STATUS_LABEL, useDemo, type OrderStatus } from "@/demo/store";
import { formatCents } from "@/lib/money";

const STEPS: OrderStatus[] = [
  "pago",
  "em_preparo",
  "saiu_para_entrega",
  "entregue",
];

export function OrderTracking() {
  const { numero } = useParams<{ numero: string }>();
  const order = useDemo((s) => s.orders.find((o) => o.number === numero));

  if (!order) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl">Pedido não encontrado</h1>
        <p className="text-ink-600">
          No protótipo, os pedidos ficam salvos só neste navegador.
        </p>
        <Link href="/loja" className="underline">
          Voltar à loja
        </Link>
      </div>
    );
  }

  const zone = DELIVERY_ZONES.find((z) => z.id === order.zoneId);
  const current = STEPS.indexOf(order.status);
  const whatsText = encodeURIComponent(
    `Olá! Fiz o pedido ${order.number} no site da Emkasa.`,
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-leaf-700 text-xs font-medium tracking-widest uppercase">
          Pedido {order.number}
        </p>
        <h1 className="text-4xl">
          {order.status === "cancelado"
            ? "Pedido cancelado"
            : "Pedido confirmado!"}
        </h1>
        <p className="text-ink-600">
          Entrega: {zone?.name} ·{" "}
          {order.deliveryDate.split("-").reverse().join("/")}
        </p>
      </div>

      {order.status !== "cancelado" && (
        <ol className="grid grid-cols-4 gap-2" aria-label="Andamento">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-col gap-2">
              <span
                className={`h-1.5 rounded-full ${i <= current ? "bg-forest-700" : "bg-sand-200"}`}
              />
              <span
                className={`text-xs ${i <= current ? "text-forest-900 font-medium" : "text-ink-600"}`}
                aria-current={i === current ? "step" : undefined}
              >
                {STATUS_LABEL[s]}
              </span>
            </li>
          ))}
        </ol>
      )}

      <section className="bg-paper rounded-(--radius-media) p-5 text-sm">
        <ul className="flex flex-col gap-1">
          {order.lines.map((l) => (
            <li key={l.slug} className="flex justify-between">
              <span>
                {l.quantity}× {l.name}
              </span>
              <span>{formatCents(l.priceCents * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="border-sand-200 mt-3 flex justify-between border-t pt-3 font-medium">
          <span>Total pago (simulado)</span>
          <span>{formatCents(order.totalCents)}</span>
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <a
          href={`https://wa.me/?text=${whatsText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-forest-900 text-cream-50 min-h-11 rounded-(--radius-control) px-5 py-3 font-medium"
        >
          Falar no WhatsApp
        </a>
        <Link
          href="/minha-casa"
          className="border-forest-900 text-forest-900 min-h-11 rounded-(--radius-control) border px-5 py-3 font-medium"
        >
          Ver Minha Casa
        </Link>
      </div>
      <p className="text-ink-600 text-xs">
        Dica do protótipo: mude o status deste pedido em Painel → Pedidos e veja
        esta página atualizar.
      </p>
    </div>
  );
}
