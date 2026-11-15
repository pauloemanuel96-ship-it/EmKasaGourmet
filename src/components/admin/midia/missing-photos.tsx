"use client";

import Link from "next/link";
import { suggestedFileName } from "@/modules/midia/matching";

type Product = { id: string; slug: string; name: string };

/** Lista de produtos sem foto principal, com o nome de arquivo sugerido. */
export function MissingPhotos({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="text-ink-600">Todos os produtos têm foto principal. 🎉</p>
    );
  }

  function download() {
    const lines = [
      "produto;id;arquivo_sugerido",
      ...products.map(
        (p) =>
          `${p.name.replace(/;/g, ",")};${p.id};${suggestedFileName(p.slug)}`,
      ),
    ];
    // BOM para o Excel abrir os acentos certo.
    const blob = new Blob(["﻿" + lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "produtos-sem-foto.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-ink-600 text-sm">
        Salve cada foto com o nome sugerido e arraste a pasta inteira na
        importação em lote: o sistema liga cada foto ao produto certo.
      </p>
      <div>
        <button
          type="button"
          onClick={download}
          className="border-forest-900 text-forest-900 min-h-11 rounded-(--radius-control) border px-4 font-medium"
        >
          Baixar lista (planilha)
        </button>
      </div>
      <ul className="border-sand-200 bg-paper divide-sand-200 divide-y rounded-(--radius-media) border">
        {products.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-2"
          >
            <Link
              href={`/admin/produtos/${p.id}`}
              className="font-medium underline-offset-2 hover:underline"
            >
              {p.name}
            </Link>
            <code className="text-ink-600 text-xs">
              {suggestedFileName(p.slug)}
            </code>
          </li>
        ))}
      </ul>
    </div>
  );
}
