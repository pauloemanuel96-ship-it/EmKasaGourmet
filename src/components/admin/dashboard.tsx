"use client";

import Link from "next/link";
import { PRODUCTS } from "@/demo/data";
import { STATUS_LABEL, demo, useDemo } from "@/demo/store";
import { formatCents } from "@/lib/money";

export function Dashboard() {
  const s = useDemo((x) => x);
  const soldOut = PRODUCTS.filter(
    (p) => !p.madeToOrder && (s.stock[p.slug] ?? 0) === 0,
  );
  const open = s.orders.filter(
    (o) => o.status !== "entregue" && o.status !== "cancelado",
  );
  const revenue = s.orders
    .filter((o) => o.status !== "cancelado")
    .reduce((t, o) => t + o.totalCents, 0);

  const cards = [
    {
      label: "Pedidos em aberto",
      value: String(open.length),
      href: "/admin/pedidos",
    },
    { label: "Esgotados", value: String(soldOut.length), href: "/admin/hoje" },
    {
      label: "Faturamento (demo)",
      value: formatCents(revenue),
      href: "/admin/pedidos",
    },
    {
      label: "Assinatura demo",
      value: s.subscription ? s.subscription.status : "nenhuma",
      href: "/minha-casa",
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-3xl">Bom dia!</h1>
        <p className="text-ink-600">Resumo da operação.</p>
      </div>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <li key={c.label}>
            <Link
              href={c.href}
              className="hover:ring-sand-200 bg-paper flex h-full flex-col gap-1 rounded-(--radius-media) p-4 hover:ring-2"
            >
              <span className="text-ink-600 text-xs">{c.label}</span>
              <span className="text-forest-900 font-serif text-2xl">
                {c.value}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="acoes" className="grid gap-3 sm:grid-cols-2">
        <h2 id="acoes" className="sr-only">
          Atalhos
        </h2>
        <Link
          href="/admin/hoje"
          className="bg-forest-900 text-cream-50 rounded-(--radius-media) p-5"
        >
          <p className="text-cream-50 font-serif text-xl">Atualizar o dia</p>
          <p className="text-cream-50/80 text-sm">
            O que tem, o que acabou, quanto chegou.
          </p>
        </Link>
        <Link
          href="/admin/assistente"
          className="bg-sand-200 rounded-(--radius-media) p-5"
        >
          <p className="text-forest-900 font-serif text-xl">
            Falar com o assistente
          </p>
          <p className="text-ink-600 text-sm">
            &quot;Acabou o tomate&quot;, &quot;Chegaram 10 alfaces&quot;…
          </p>
        </Link>
      </section>

      <section aria-labelledby="ultimos" className="flex flex-col gap-3">
        <h2 id="ultimos" className="text-2xl">
          Últimos pedidos
        </h2>
        {s.orders.length === 0 ? (
          <p className="text-ink-600 text-sm">
            Nenhum pedido ainda. Faça um pela loja para testar o fluxo.
          </p>
        ) : (
          <ul className="divide-sand-200 bg-paper divide-y rounded-(--radius-media) text-sm">
            {s.orders.slice(0, 5).map((o) => (
              <li
                key={o.number}
                className="flex flex-wrap justify-between gap-2 p-3"
              >
                <span className="font-medium">{o.number}</span>
                <span>{o.customer.name}</span>
                <span>{STATUS_LABEL[o.status]}</span>
                <span>{formatCents(o.totalCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="auditoria" className="flex flex-col gap-3">
        <h2 id="auditoria" className="text-2xl">
          Histórico de alterações
        </h2>
        {s.audit.length === 0 ? (
          <p className="text-ink-600 text-sm">
            Tudo o que mudar no estoque, nos preços e nos pedidos aparece aqui,
            com quem fez e quando.
          </p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {s.audit.slice(0, 12).map((a, i) => (
              <li
                key={i}
                className="border-sand-200 flex flex-wrap gap-x-3 border-b py-1.5"
              >
                <span className="text-ink-600">
                  {new Date(a.at).toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
                <span className="bg-sand-200 rounded px-1.5 text-xs leading-5">
                  {a.source}
                </span>
                <span>{a.text}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={() => {
          if (confirm("Apagar todos os dados de demonstração deste navegador?"))
            demo.reset();
        }}
        className="text-danger-600 min-h-11 self-start text-sm underline"
      >
        Reiniciar demonstração
      </button>
    </div>
  );
}
