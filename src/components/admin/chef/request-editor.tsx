"use client";

import { useActionState } from "react";
import { updateChefRequest } from "@/modules/chef/actions";
import { CHEF_STATUS } from "@/modules/chef/schemas";
import type { FormState } from "@/modules/conta/schemas";

const IDLE: FormState = { status: "idle" };

/** Andamento e anotação interna de um pedido do Chef Emkasa. */
export function ChefRequestEditor({
  id,
  status,
  staffNotes,
}: {
  id: string;
  status: string;
  staffNotes: string | null;
}) {
  const [state, action, pending] = useActionState(updateChefRequest, IDLE);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="text-ink-600 text-xs font-medium" htmlFor={`st-${id}`}>
        Andamento
      </label>
      <select
        id={`st-${id}`}
        name="status"
        defaultValue={status}
        className="border-sand-200 bg-paper min-h-11 rounded-(--radius-control) border px-3"
      >
        {CHEF_STATUS.map((s) => (
          <option key={s.code} value={s.code}>
            {s.label}
          </option>
        ))}
      </select>
      <label className="text-ink-600 text-xs font-medium" htmlFor={`nt-${id}`}>
        Anotação da equipe
      </label>
      <textarea
        id={`nt-${id}`}
        name="staffNotes"
        rows={2}
        maxLength={2000}
        defaultValue={staffNotes ?? ""}
        className="border-sand-200 bg-paper rounded-(--radius-control) border px-3 py-2 text-sm"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-forest-900 text-cream-50 min-h-11 rounded-(--radius-control) px-4 text-sm font-medium disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
        {state.status !== "idle" && state.message && (
          <span
            role="status"
            className={
              state.status === "error"
                ? "text-terracotta-500 text-sm"
                : "text-leaf-700 text-sm"
            }
          >
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
