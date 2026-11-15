"use client";

import { useState } from "react";
import { availableOf, demo, priceOf, useDemo } from "@/demo/store";
import type { StoreProduct } from "@/modules/catalogo/store-types";

/** Limite por pedido para produtos reais enquanto o checkout é demonstração. */
const MAX_QTY = 20;

export function AddToCart({ product }: { product: StoreProduct }) {
  const demoAvailable = useDemo((s) => availableOf(s, product.slug));
  const demoPrice = useDemo((s) => priceOf(s, product.slug));
  const available = product.isDemo
    ? demoAvailable
    : product.available
      ? MAX_QTY
      : 0;
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);

  if (available === 0) {
    return (
      <p className="bg-sand-200 text-ink-600 rounded-(--radius-control) p-4 text-sm">
        Esgotado no momento. Volte amanhã: a horta muda todo dia.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div
          className="border-ink-600/30 flex items-center rounded-(--radius-control) border"
          role="group"
          aria-label="Quantidade"
        >
          <button
            type="button"
            className="min-h-11 min-w-11 text-lg"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Diminuir"
          >
            –
          </button>
          <span className="min-w-8 text-center" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            className="min-h-11 min-w-11 text-lg"
            onClick={() => setQty((q) => Math.min(available, q + 1))}
            aria-label="Aumentar"
          >
            +
          </button>
        </div>
        <button
          type="button"
          className="bg-forest-900 text-cream-50 hover:bg-forest-700 min-h-11 flex-1 rounded-(--radius-control) px-5 font-medium transition active:scale-[0.98]"
          onClick={() => {
            const r = demo.addToCart(
              product.slug,
              qty,
              product.isDemo
                ? undefined
                : {
                    name: product.name,
                    unitLabel: product.unitLabel,
                    priceCents: product.priceCents ?? demoPrice,
                    storage: product.storage,
                    madeToOrder: product.madeToOrder,
                  },
            );
            setMsg(r.message);
          }}
        >
          Adicionar ao carrinho
        </button>
      </div>
      {product.isDemo && available < 99 && (
        <p className="text-ink-600 text-xs">{available} disponível(is) agora</p>
      )}
      {msg && (
        <p role="status" className="text-forest-700 text-sm">
          {msg}
        </p>
      )}
    </div>
  );
}
