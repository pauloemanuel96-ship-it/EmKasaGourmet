"use client";

import { useState } from "react";
import { availableOf, demo, useDemo } from "@/demo/store";

export function AddToCart({ slug }: { slug: string }) {
  const available = useDemo((s) => availableOf(s, slug));
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
          className="bg-forest-900 text-cream-50 hover:bg-forest-700 min-h-11 flex-1 rounded-(--radius-control) px-5 font-medium"
          onClick={() => {
            const r = demo.addToCart(slug, qty);
            setMsg(r.message);
          }}
        >
          Adicionar ao carrinho
        </button>
      </div>
      {available < 99 && (
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
