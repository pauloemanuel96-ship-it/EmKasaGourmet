"use client";

import Link from "next/link";
import { availableOf, priceOf, useDemo } from "@/demo/store";
import { formatCents } from "@/lib/money";
import type { StoreProduct } from "@/modules/catalogo/store-types";
import { DemoTag } from "./demo-tag";
import { ProductImage } from "./product-image";

export function ProductTile({ product }: { product: StoreProduct }) {
  // Na demonstração, preço e estoque vêm do estado do navegador (o painel
  // demo mexe neles). Produto real usa o que veio do banco.
  const demoPrice = useDemo((s) => priceOf(s, product.slug));
  const demoAvailable = useDemo((s) => availableOf(s, product.slug));
  const price = product.isDemo ? demoPrice : product.priceCents;
  const soldOut = product.isDemo ? demoAvailable === 0 : !product.available;

  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group flex flex-col gap-3"
    >
      <div className="relative">
        <ProductImage
          product={product}
          className={`transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lg ${soldOut ? "opacity-55 grayscale-[35%]" : ""}`}
        />
        {product.isDemo && <DemoTag className="absolute top-3 left-3" />}
        {soldOut ? (
          <span className="bg-ink-900/80 absolute bottom-3 left-3 rounded px-2 py-1 text-xs font-medium text-white">
            Esgotado
          </span>
        ) : product.madeToOrder || product.quoteOnly ? (
          <span className="bg-terracotta-500 absolute bottom-3 left-3 rounded px-2 py-1 text-xs font-medium text-white">
            Sob encomenda
          </span>
        ) : product.inSeason ? (
          <span className="bg-leaf-700 absolute bottom-3 left-3 rounded px-2 py-1 text-xs font-medium text-white">
            Época de colheita
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-ink-900 font-sans text-base font-medium group-hover:underline">
          {product.name}
        </h3>
        <p className="text-ink-600 text-sm">{product.unitLabel}</p>
        <p className="text-terracotta-500 font-medium">
          {price !== null
            ? formatCents(price)
            : product.quoteOnly
              ? "Sob orçamento"
              : ""}
          {product.isDemo && price !== null && (
            <span className="text-ink-600 ml-1 text-xs font-normal">
              (demo)
            </span>
          )}
        </p>
        {product.diet.length > 0 && (
          <p className="text-leaf-700 text-xs">
            {product.diet.map((d) => d.name).join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}
