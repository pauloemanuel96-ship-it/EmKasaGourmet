"use client";

import { priceOf, useDemo } from "@/demo/store";
import { formatCents } from "@/lib/money";

/** Preço de um produto de demonstração (o painel demo pode alterá-lo). */
export function DemoPrice({ slug }: { slug: string }) {
  const price = useDemo((s) => priceOf(s, slug));
  return (
    <p className="text-terracotta-500 text-2xl font-medium">
      {formatCents(price)}{" "}
      <span className="text-ink-600 text-sm font-normal">(demo)</span>
    </p>
  );
}
