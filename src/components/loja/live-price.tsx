"use client";

import { priceOf, useDemo } from "@/demo/store";
import { formatCents } from "@/lib/money";

export function LivePrice({ slug }: { slug: string }) {
  const price = useDemo((s) => priceOf(s, slug));
  return (
    <p className="text-terracotta-500 text-2xl font-medium">
      {formatCents(price)}
    </p>
  );
}
