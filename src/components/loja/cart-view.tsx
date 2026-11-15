"use client";

import Link from "next/link";
import { STORAGE_LABEL, productBySlug, type Storage } from "@/demo/data";
import { availableOf, cartLines, demo, useDemo } from "@/demo/store";
import { formatCents } from "@/lib/money";

export function CartView() {
  const lines = useDemo(cartLines);
  const state = useDemo((s) => s);

  if (lines.length === 0) {
    return (
      <div className="bg-sand-200/60 mt-8 flex flex-col items-start gap-4 rounded-(--radius-media) p-8">
        <p className="text-ink-600">Seu carrinho está vazio.</p>
        <Link
          href="/loja"
          className="bg-forest-900 text-cream-50 min-h-11 rounded-(--radius-control) px-5 py-3 font-medium"
        >
          Ir para a loja
        </Link>
      </div>
    );
  }

  const groups = new Map<Storage, typeof lines>();
  for (const l of lines) {
    const st = productBySlug(l.slug)?.storage ?? "ambiente";
    groups.set(st, [...(groups.get(st) ?? []), l]);
  }
  const subtotal = lines.reduce((t, l) => t + l.priceCents * l.quantity, 0);

  return (
    <div className="mt-8 flex flex-col gap-8">
      {[...groups.entries()].map(([storage, items]) => (
        <section key={storage} aria-labelledby={`g-${storage}`}>
          <h2
            id={`g-${storage}`}
            className="text-ink-600 mb-3 font-sans text-sm font-medium tracking-wide uppercase"
          >
            {STORAGE_LABEL[storage]}
          </h2>
          <ul className="divide-sand-200 divide-y rounded-(--radius-media) bg-white">
            {items.map((l) => (
              <li
                key={l.slug}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <Link
                    href={`/produto/${l.slug}`}
                    className="font-medium hover:underline"
                  >
                    {l.name}
                  </Link>
                  <p className="text-ink-600 text-sm">
                    {l.unitLabel} · {formatCents(l.priceCents)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="border-ink-600/30 flex items-center rounded-(--radius-control) border"
                    role="group"
                    aria-label={`Quantidade de ${l.name}`}
                  >
                    <button
                      type="button"
                      className="min-h-11 min-w-11"
                      aria-label="Diminuir"
                      onClick={() =>
                        demo.setCartQuantity(l.slug, l.quantity - 1)
                      }
                    >
                      –
                    </button>
                    <span className="min-w-6 text-center">{l.quantity}</span>
                    <button
                      type="button"
                      className="min-h-11 min-w-11 disabled:opacity-40"
                      aria-label="Aumentar"
                      disabled={l.quantity >= availableOf(state, l.slug)}
                      onClick={() =>
                        demo.setCartQuantity(l.slug, l.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                  <p className="w-24 text-right font-medium">
                    {formatCents(l.priceCents * l.quantity)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {groups.size > 1 && (
        <p className="bg-sand-200/60 text-ink-600 rounded-(--radius-control) p-4 text-sm">
          Seu pedido tem itens com conservações diferentes. Eles chegam em
          embalagens separadas; guarde os congelados primeiro.
        </p>
      )}
      <div className="border-sand-200 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <p className="text-lg">
          Subtotal <strong>{formatCents(subtotal)}</strong>
        </p>
        <Link
          href="/checkout"
          className="bg-forest-900 text-cream-50 hover:bg-forest-700 min-h-11 rounded-(--radius-control) px-6 py-3 font-medium"
        >
          Continuar
        </Link>
      </div>
    </div>
  );
}
