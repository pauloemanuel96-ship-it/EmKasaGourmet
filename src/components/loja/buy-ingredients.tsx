"use client";

import Link from "next/link";
import { useState } from "react";
import { productBySlug } from "@/demo/data";
import { availableOf, demo, priceOf, useDemo } from "@/demo/store";
import { formatCents } from "@/lib/money";

/** Conteúdo → produto → compra: o ciclo da plataforma (BUSINESS_OVERVIEW §4). */
export function BuyIngredients({ slugs }: { slugs: string[] }) {
  const s = useDemo((x) => x);
  const [msg, setMsg] = useState<string | null>(null);
  const items = slugs.map((slug) => ({
    p: productBySlug(slug)!,
    available: availableOf(s, slug),
    price: priceOf(s, slug),
  }));
  const buyable = items.filter((i) => i.available > 0);

  return (
    <section
      aria-labelledby="comprar"
      className="mt-12 rounded-(--radius-media) bg-white p-6"
    >
      <h2 id="comprar" className="mb-4 text-2xl">
        Compre os ingredientes
      </h2>
      <ul className="flex flex-col gap-2 text-sm">
        {items.map((i) => (
          <li key={i.p.slug} className="flex justify-between gap-2">
            <Link href={`/produto/${i.p.slug}`} className="hover:underline">
              {i.p.name}
            </Link>
            <span className={i.available ? "" : "text-ink-600"}>
              {i.available ? formatCents(i.price) : "Esgotado"}
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={buyable.length === 0}
        onClick={() => {
          for (const i of buyable) demo.addToCart(i.p.slug, 1);
          setMsg(`${buyable.length} item(ns) no carrinho.`);
        }}
        className="bg-forest-900 text-cream-50 mt-5 min-h-11 rounded-(--radius-control) px-5 font-medium disabled:opacity-50"
      >
        Adicionar o que tem hoje
      </button>
      {msg && (
        <p role="status" className="text-forest-700 mt-2 text-sm">
          {msg}{" "}
          <Link href="/carrinho" className="underline">
            Ver carrinho
          </Link>
        </p>
      )}
    </section>
  );
}
