"use client";

import { useId, useState } from "react";
import type { Option } from "@/modules/catalogo/types";
import { inputClass } from "./fields";

/**
 * Lista ordenada de ingredientes (a ordem é a do rótulo: do maior para o menor).
 * Envia `ingredient_ids` na ordem escolhida.
 */
export function IngredientPicker({
  options,
  initial,
}: {
  options: Option[];
  initial: string[];
}) {
  const [ids, setIds] = useState(initial);
  const [pick, setPick] = useState("");
  const selectId = useId();
  const byId = new Map(options.map((o) => [o.id, o.name]));
  const available = options.filter((o) => !ids.includes(o.id));

  const move = (index: number, delta: number) =>
    setIds((list) => {
      const next = [...list];
      const target = index + delta;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  if (options.length === 0) {
    return (
      <p className="text-ink-600 text-sm">
        Nenhum ingrediente cadastrado ainda. O cadastro de ingredientes chega na
        próxima entrega do painel.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {ids.map((id) => (
        <input key={id} type="hidden" name="ingredient_ids" value={id} />
      ))}

      {ids.length > 0 ? (
        <ol className="border-sand-200 divide-sand-200 divide-y rounded-(--radius-control) border">
          {ids.map((id, i) => (
            <li key={id} className="flex items-center gap-2 px-3 py-1">
              <span className="text-ink-600 w-6 text-sm tabular-nums">
                {i + 1}.
              </span>
              <span className="flex-1">{byId.get(id) ?? "(removido)"}</span>
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Subir ${byId.get(id)}`}
                className="min-h-11 min-w-11 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === ids.length - 1}
                aria-label={`Descer ${byId.get(id)}`}
                className="min-h-11 min-w-11 disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => setIds((l) => l.filter((x) => x !== id))}
                aria-label={`Tirar ${byId.get(id)}`}
                className="text-danger-600 min-h-11 min-w-11"
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-ink-600 text-sm">Nenhum ingrediente na ficha.</p>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor={selectId} className="text-sm font-medium">
            Adicionar ingrediente
          </label>
          <select
            id={selectId}
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            className={inputClass}
          >
            <option value="">Escolha…</option>
            {available.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          disabled={!pick}
          onClick={() => {
            setIds((l) => [...l, pick]);
            setPick("");
          }}
          className="border-forest-900 text-forest-900 min-h-11 rounded-(--radius-control) border px-4 font-medium disabled:opacity-50"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
