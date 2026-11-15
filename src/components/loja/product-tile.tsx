"use client";

import Link from "next/link";
import { DIET_LABEL, type Product } from "@/demo/data";
import { availableOf, priceOf, useDemo } from "@/demo/store";
import { formatCents } from "@/lib/money";
import { ProductArt } from "./product-art";

export function ProductTile({ product }: { product: Product }) {
  const price = useDemo((s) => priceOf(s, product.slug));
  const available = useDemo((s) => availableOf(s, product.slug));
  const soldOut = available === 0;

  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group flex flex-col gap-3"
    >
      <div className="relative">
        <ProductArt
          name={product.name}
          tone={product.tone}
          className={`transition group-hover:brightness-105 ${soldOut ? "opacity-55 grayscale-[35%]" : ""}`}
        />
        {soldOut && (
          <span className="bg-ink-900/80 absolute bottom-3 left-3 rounded px-2 py-1 text-xs font-medium text-white">
            Esgotado
          </span>
        )}
        {product.madeToOrder && !soldOut && (
          <span className="bg-terracotta-500 absolute bottom-3 left-3 rounded px-2 py-1 text-xs font-medium text-white">
            Sob encomenda
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-ink-900 font-sans text-base font-medium group-hover:underline">
          {product.name}
        </h3>
        <p className="text-ink-600 text-sm">{product.unitLabel}</p>
        <p className="text-terracotta-500 font-medium">{formatCents(price)}</p>
        {product.diet.length > 0 && (
          <p className="text-leaf-700 text-xs">
            {product.diet.map((d) => DIET_LABEL[d]).join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}
