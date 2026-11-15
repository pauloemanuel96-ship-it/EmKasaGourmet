"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { deleteUnusedFile } from "@/modules/midia/actions";
import { normalize } from "@/modules/midia/matching";
import type { LibraryItem } from "@/modules/midia/queries";
import { Badge, inputClass } from "../catalogo/fields";

export function Library({ items }: { items: LibraryItem[] }) {
  const [q, setQ] = useState("");
  const [onlyUnused, setOnlyUnused] = useState(false);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [big, setBig] = useState<LibraryItem | null>(null);

  const term = normalize(q);
  const shown = items.filter(
    (i) =>
      (!onlyUnused || i.usedBy.length === 0) &&
      (!term ||
        normalize(
          `${i.path} ${i.usedBy.map((u) => u.productName).join(" ")}`,
        ).includes(term)),
  );
  const unused = items.filter((i) => i.usedBy.length === 0).length;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor="busca-midia" className="text-sm font-medium">
            Buscar por produto ou arquivo
          </label>
          <input
            id="busca-midia"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={inputClass}
          />
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyUnused}
            onChange={(e) => setOnlyUnused(e.target.checked)}
            className="accent-forest-900 size-5"
          />
          Só sem uso ({unused})
        </label>
      </div>

      {message && (
        <p
          role="status"
          className="bg-sand-200 rounded-(--radius-control) p-3 text-sm"
        >
          {message}
        </p>
      )}

      {shown.length === 0 ? (
        <p className="text-ink-600">
          {items.length === 0
            ? "Nenhuma foto enviada ainda."
            : "Nada encontrado."}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((i) => (
            <li key={i.path} className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setBig(i)}
                className="bg-sand-200 relative aspect-square overflow-hidden rounded-(--radius-control)"
                aria-label={`Ampliar ${i.path}`}
              >
                <Image
                  src={i.url}
                  alt=""
                  fill
                  sizes="240px"
                  className="object-cover"
                />
              </button>
              <p className="text-ink-600 truncate text-xs" title={i.path}>
                {i.path}
              </p>
              {i.usedBy.length > 0 ? (
                <p className="text-sm">
                  {i.usedBy
                    .map(
                      (u) => u.productName + (u.isCover ? " (principal)" : ""),
                    )
                    .join(", ")}
                </p>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge tone="muted">Sem uso</Badge>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (
                        !window.confirm(
                          "Apagar este arquivo? Não dá para desfazer.",
                        )
                      )
                        return;
                      start(async () => {
                        const r = await deleteUnusedFile(i.path);
                        setMessage(r.status === "idle" ? null : r.message);
                      });
                    }}
                    className="text-danger-600 min-h-11 text-sm underline"
                  >
                    Apagar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {big && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto ampliada"
          className="bg-ink-900/80 fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setBig(null)}
        >
          <div className="relative h-[80vh] w-full max-w-3xl">
            <Image
              src={big.url}
              alt=""
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
          <button
            type="button"
            onClick={() => setBig(null)}
            className="bg-cream-50 text-forest-900 absolute top-4 right-4 min-h-11 rounded-(--radius-control) px-4 font-medium"
          >
            Fechar
          </button>
        </div>
      )}
    </section>
  );
}
